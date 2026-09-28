// =====================================================
// NETFLOW - PACKET TRANSMISSION SIMULATOR
// Dijkstra + Go-Back-N + Packet Loss + Retransmission
// =====================================================


// =====================================================
// NETWORK GRAPH
// =====================================================

const network = {

    R1: {
        R2: 10,
        R3: 15
    },

    R2: {
        R1: 10,
        R4: 10
    },

    R3: {
        R1: 15,
        R4: 13
    },

    R4: {
        R2: 10,
        R3: 13
    }

};


// =====================================================
// DIJKSTRA SHORTEST PATH
// =====================================================

function dijkstra(graph, start, end) {

    const distances = {};
    const previous = {};
    const unvisited = new Set(Object.keys(graph));

    for (let node in graph) {

        distances[node] = Infinity;
        previous[node] = null;

    }

    distances[start] = 0;

    while (unvisited.size > 0) {

        let currentNode = null;
        let smallestDistance = Infinity;

        for (let node of unvisited) {

            if (distances[node] < smallestDistance) {

                smallestDistance = distances[node];
                currentNode = node;

            }

        }

        if (currentNode === null) {
            break;
        }

        unvisited.delete(currentNode);

        if (currentNode === end) {
            break;
        }

        for (let neighbor in graph[currentNode]) {

            if (!unvisited.has(neighbor)) {
                continue;
            }

            const edgeCost =
                graph[currentNode][neighbor];

            const newDistance =
                distances[currentNode] + edgeCost;

            if (newDistance < distances[neighbor]) {

                distances[neighbor] = newDistance;
                previous[neighbor] = currentNode;

            }

        }

    }

    const path = [];

    let current = end;

    while (current !== null) {

        path.unshift(current);

        current = previous[current];

    }

    return {

        path: path,
        cost: distances[end]

    };

}


// =====================================================
// FIND SHORTEST ROUTE
// =====================================================

function findShortestRoute() {

    return dijkstra(network, "R1", "R4");

}


// =====================================================
// UPDATE ROUTE
// =====================================================

function updateRoute() {

    const result =
        findShortestRoute();

    const routeElement =
        document.getElementById("currentRoute");

    if (routeElement) {

        routeElement.textContent =
            "R1 → " +
            result.path.slice(1).join(" → ");

    }

    return result;

}


// =====================================================
// HIGHLIGHT ROUTE
// =====================================================

function highlightRoute() {

    document
        .querySelectorAll(".node")
        .forEach(node => {

            node.classList.remove("active");

        });


    document
        .querySelectorAll(".line")
        .forEach(line => {

            line.classList.remove("active");

        });


    const activeNodes = [

        "sender",
        "r1",
        "r2",
        "r4",
        "receiver"

    ];


    activeNodes.forEach(id => {

        const node =
            document.getElementById(id);

        if (node) {

            node.classList.add("active");

        }

    });


    const activeLines = [

        ".line-sender-r1",
        ".line-r1-r2",
        ".line-r2-r4",
        ".line-r4-receiver"

    ];


    activeLines.forEach(selector => {

        const line =
            document.querySelector(selector);

        if (line) {

            line.classList.add("active");

        }

    });

}


// =====================================================
// UPDATE ACTIVITY
// =====================================================

function updateActivity(title, message) {

    const titleElement =
        document.getElementById("activityTitle");

    const textElement =
        document.getElementById("activityText");


    if (titleElement) {

        titleElement.textContent = title;

    }


    if (textElement) {

        textElement.textContent = message;

    }

}


// =====================================================
// UPDATE PACKET
// =====================================================

function updatePacket(packetNumber, state, stateText) {

    const packets =
        document.querySelectorAll(".packet-item");


    const packet =
        packets[packetNumber - 1];


    if (!packet) {
        return;
    }


    packet.classList.remove(
        "waiting",
        "sent",
        "delivered",
        "lost",
        "retransmitted"
    );


    packet.classList.add(state);


    const status =
        packet.querySelector(".packet-state");


    if (status) {

        status.textContent = stateText;

    }

}


// =====================================================
// DELAY FUNCTION
// =====================================================

function wait(milliseconds) {

    return new Promise(resolve => {

        setTimeout(resolve, milliseconds);

    });

}


// =====================================================
// PACKET TRANSMISSION
// =====================================================

async function transmitPackets() {

    const totalPackets = 8;

    let delivered = 0;
    let lost = 0;
    let retransmissions = 0;


    // Reset packet list

    document
        .querySelectorAll(".packet-item")
        .forEach(packet => {

            packet.className =
                "packet-item waiting";

            const state =
                packet.querySelector(".packet-state");

            if (state) {

                state.textContent =
                    "Waiting";

            }

        });


    // Reset progress

    document.getElementById(
        "progressFill"
    ).style.width = "0%";


    document.getElementById(
        "progressText"
    ).textContent = "0%";


    // Start transmission

    updateActivity(
        "Transmission started",
        "Packets are being transmitted using the Go-Back-N protocol."
    );


    for (
        let packet = 1;
        packet <= totalPackets;
        packet++
    ) {

        // Current packet

        document.getElementById(
            "currentPacket"
        ).textContent =
            "Packet " +
            String(packet).padStart(2, "0");


        document.getElementById(
            "packetStatus"
        ).textContent =
            "Sending";


        // Mark packet as sent

        updatePacket(
            packet,
            "sent",
            "Sending"
        );


        updateActivity(
            "Sending Packet " +
            String(packet).padStart(2, "0"),
            "Packet is travelling through the selected route."
        );


        await wait(700);


        // ---------------------------------------------
        // Simulate packet loss
        // Packet 3 and Packet 6 are lost intentionally
        // ---------------------------------------------

        if (packet === 3 || packet === 6) {

            lost++;


            updatePacket(
                packet,
                "lost",
                "Lost"
            );


            document.getElementById(
                "packetStatus"
            ).textContent =
                "Packet Lost";


            updateActivity(
                "Packet " +
                String(packet).padStart(2, "0") +
                " Lost",
                "Packet loss detected. Go-Back-N requires retransmission."
            );


            await wait(900);


            // -----------------------------------------
            // RETRANSMISSION
            // -----------------------------------------

            retransmissions++;


            updatePacket(
                packet,
                "retransmitted",
                "Retransmitting"
            );


            document.getElementById(
                "packetStatus"
            ).textContent =
                "Retransmitting";


            updateActivity(
                "Retransmission",
                "Packet " +
                String(packet).padStart(2, "0") +
                " is being retransmitted."
            );


            await wait(900);


            delivered++;


            updatePacket(
                packet,
                "delivered",
                "Delivered ✓"
            );


            document.getElementById(
                "packetStatus"
            ).textContent =
                "Delivered";


            updateActivity(
                "Packet Delivered",
                "Retransmitted packet successfully reached the receiver."
            );

        }


        // ---------------------------------------------
        // NORMAL DELIVERY
        // ---------------------------------------------

        else {

            delivered++;


            updatePacket(
                packet,
                "delivered",
                "Delivered ✓"
            );


            document.getElementById(
                "packetStatus"
            ).textContent =
                "Delivered";


            updateActivity(
                "Packet Delivered",
                "Packet successfully reached the receiver."
            );

        }


        // ---------------------------------------------
        // UPDATE STATISTICS
        // ---------------------------------------------

        document.getElementById(
            "packetsSent"
        ).textContent =
            packet;


        document.getElementById(
            "packetsDelivered"
        ).textContent =
            delivered;


        document.getElementById(
            "packetsLost"
        ).textContent =
            lost;


        document.getElementById(
            "retransmissions"
        ).textContent =
            retransmissions;


        // ---------------------------------------------
        // UPDATE PROGRESS
        // ---------------------------------------------

        const progress =
            Math.round(
                (packet / totalPackets) * 100
            );


        document.getElementById(
            "progressFill"
        ).style.width =
            progress + "%";


        document.getElementById(
            "progressText"
        ).textContent =
            progress + "%";


        await wait(500);

    }


    // =================================================
    // TRANSMISSION COMPLETE
    // =================================================

    document.getElementById(
        "currentPacket"
    ).textContent =
        "Complete";


    document.getElementById(
        "packetStatus"
    ).textContent =
        "Transmission Complete";


    updateActivity(
        "Transmission Complete",
        "All packets have been delivered. Lost packets were successfully retransmitted using Go-Back-N."
    );


    console.log(
        "Transmission completed."
    );


    console.log(
        "Packets Delivered:",
        delivered
    );


    console.log(
        "Packets Lost:",
        lost
    );


    console.log(
        "Retransmissions:",
        retransmissions
    );

}


// =====================================================
// START SIMULATION
// =====================================================

async function startSimulation() {

    const startButton =
        document.getElementById("startBtn");


    // Prevent multiple clicks

    startButton.disabled = true;

    startButton.textContent =
        "⏳ Simulation Running...";


    // ---------------------------------------------
    // FIND ROUTE
    // ---------------------------------------------

    const result =
        updateRoute();


    highlightRoute();


    // ---------------------------------------------
    // NETWORK VALUES
    // ---------------------------------------------

    document.getElementById(
        "delay"
    ).textContent =
        "42 ms";


    document.getElementById(
        "congestion"
    ).textContent =
        "MEDIUM";


    // ---------------------------------------------
    // START PACKET TRANSMISSION
    // ---------------------------------------------

    await transmitPackets();


    // ---------------------------------------------
    // FINISH
    // ---------------------------------------------

    startButton.disabled = false;

    startButton.textContent =
        "↻ Run Simulation";

}


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "NetFlow loaded successfully."
        );


        const startButton =
            document.getElementById("startBtn");


        if (startButton) {

            startButton.addEventListener(
                "click",
                startSimulation
            );

        }


        // Calculate initial route

        updateRoute();

    }
);