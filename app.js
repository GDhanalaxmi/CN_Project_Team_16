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

            const edgeCost = graph[currentNode][neighbor];
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

function findShortestRoute() {
    return dijkstra(network, "R1", "R4");
}

function updateRoute() {
    const result = findShortestRoute();

    const routeElement =
        document.getElementById("currentRoute");

    if (routeElement) {
        routeElement.textContent =
            result.path.join(" → ");
    }

    return result;
}

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
        "retransmitted",
        "discarded"
    );

    packet.classList.add(state);

    const status =
        packet.querySelector(".packet-state");

    if (status) {
        status.textContent = stateText;
    }
}

function updateStatistics(
    sent,
    delivered,
    lost,
    retransmissions
) {
    document.getElementById(
        "packetsSent"
    ).textContent = sent;

    document.getElementById(
        "packetsDelivered"
    ).textContent = delivered;

    document.getElementById(
        "packetsLost"
    ).textContent = lost;

    document.getElementById(
        "retransmissions"
    ).textContent = retransmissions;
}

function updateProgress(delivered, totalPackets) {
    const progress =
        Math.round(
            (delivered / totalPackets) * 100
        );

    document.getElementById(
        "progressFill"
    ).style.width =
        progress + "%";

    document.getElementById(
        "progressText"
    ).textContent =
        progress + "%";
}

function wait(milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

async function sendPacket(
    packet,
    isRetransmission = false
) {
    const packetName =
        "Packet " +
        String(packet).padStart(2, "0");

    document.getElementById(
        "currentPacket"
    ).textContent = packetName;

    document.getElementById(
        "packetStatus"
    ).textContent =
        isRetransmission
            ? "Retransmitting"
            : "Sending";

    updatePacket(
        packet,
        isRetransmission
            ? "retransmitted"
            : "sent",
        isRetransmission
            ? "Retransmitting"
            : "Sending"
    );

    updateActivity(
        isRetransmission
            ? "Go-Back-N Retransmission"
            : "Sending " + packetName,
        isRetransmission
            ? packetName +
              " is being retransmitted after timeout."
            : packetName +
              " is travelling through the selected route."
    );

    await wait(700);
}

async function transmitWindow(
    windowStart,
    windowEnd,
    lostPacket,
    state
) {
    let lostDetected = false;

    for (
        let packet = windowStart;
        packet <= windowEnd;
        packet++
    ) {
        await sendPacket(
            packet,
            state.retransmitting
        );

        state.packetsSent++;

        if (
            packet === lostPacket &&
            !state.lossHandled[lostPacket]
        ) {
            state.lossHandled[lostPacket] = true;

            state.lost++;

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
                "ACK was not received. Go-Back-N will wait for timeout."
            );

            lostDetected = true;

            await wait(700);

            continue;
        }

        if (
            lostDetected &&
            packet > lostPacket
        ) {
            updatePacket(
                packet,
                "discarded",
                "Discarded"
            );

            document.getElementById(
                "packetStatus"
            ).textContent =
                "Out of Order";

            updateActivity(
                "Packet " +
                String(packet).padStart(2, "0") +
                " Discarded",
                "Receiver discarded the out-of-order packet and expects Packet " +
                String(lostPacket).padStart(2, "0") +
                "."
            );

            await wait(500);

            continue;
        }

        if (!lostDetected) {
            state.delivered++;

            updatePacket(
                packet,
                "delivered",
                "ACK " + packet + " ✓"
            );

            document.getElementById(
                "packetStatus"
            ).textContent =
                "ACK " + packet;

            updateActivity(
                "ACK " + packet + " Received",
                "Receiver acknowledged Packet " +
                packet +
                "."
            );

            updateStatistics(
                state.packetsSent,
                state.delivered,
                state.lost,
                state.retransmissions
            );

            updateProgress(
                state.delivered,
                state.totalPackets
            );

            await wait(450);
        }
    }

    if (lostDetected) {
        updateActivity(
            "Timeout",
            "ACK for Packet " +
            lostPacket +
            " was not received. Sender goes back to Packet " +
            lostPacket +
            "."
        );

        document.getElementById(
            "packetStatus"
        ).textContent =
            "Timeout";

        await wait(1000);

        for (
            let packet = lostPacket;
            packet <= windowEnd;
            packet++
        ) {
            state.retransmissions++;

            await sendPacket(
                packet,
                true
            );

            state.packetsSent++;

            state.delivered++;

            updatePacket(
                packet,
                "delivered",
                "ACK " + packet + " ✓"
            );

            document.getElementById(
                "packetStatus"
            ).textContent =
                "ACK " + packet;

            updateActivity(
                "ACK " + packet + " Received",
                "Retransmitted Packet " +
                packet +
                " was successfully acknowledged."
            );

            updateStatistics(
                state.packetsSent,
                state.delivered,
                state.lost,
                state.retransmissions
            );

            updateProgress(
                state.delivered,
                state.totalPackets
            );

            await wait(500);
        }
    }

    updateStatistics(
        state.packetsSent,
        state.delivered,
        state.lost,
        state.retransmissions
    );

    updateProgress(
        state.delivered,
        state.totalPackets
    );
}

async function transmitPackets() {
    const totalPackets = 8;
    const windowSize = 4;

    const state = {
        totalPackets: totalPackets,
        packetsSent: 0,
        delivered: 0,
        lost: 0,
        retransmissions: 0,
        lossHandled: {},
        retransmitting: false
    };

    document
        .querySelectorAll(".packet-item")
        .forEach(packet => {
            packet.className =
                "packet-item waiting";

            const status =
                packet.querySelector(".packet-state");

            if (status) {
                status.textContent =
                    "Waiting";
            }
        });

    document.getElementById(
        "progressFill"
    ).style.width = "0%";

    document.getElementById(
        "progressText"
    ).textContent = "0%";

    updateStatistics(
        0,
        0,
        0,
        0
    );

    updateActivity(
        "Go-Back-N Started",
        "Sliding window size is 4. Sender can transmit four packets before waiting for acknowledgements."
    );

    await wait(800);

    updateActivity(
        "Window 1: Packets 1–4",
        "Sender is transmitting the first four packets."
    );

    await wait(500);

    await transmitWindow(
        1,
        4,
        3,
        state
    );

    state.retransmitting = false;

    await wait(700);

    updateActivity(
        "Window 2: Packets 5–8",
        "First window completed. Sender moves the sliding window forward."
    );

    await wait(700);

    await transmitWindow(
        5,
        8,
        6,
        state
    );

    await wait(700);

    document.getElementById(
        "currentPacket"
    ).textContent =
        "Complete";

    document.getElementById(
        "packetStatus"
    ).textContent =
        "Transmission Complete";

    document.getElementById(
        "progressFill"
    ).style.width =
        "100%";

    document.getElementById(
        "progressText"
    ).textContent =
        "100%";

    updateActivity(
        "Transmission Complete",
        "All packets were delivered. Lost packets and subsequent packets in their windows were retransmitted using Go-Back-N."
    );

    console.log(
        "Go-Back-N transmission completed."
    );

    console.log(
        "Total transmissions:",
        state.packetsSent
    );

    console.log(
        "Packets delivered:",
        state.delivered
    );

    console.log(
        "Packets lost:",
        state.lost
    );

    console.log(
        "Retransmitted packets:",
        state.retransmissions
    );
}

async function startSimulation() {
    const startButton =
        document.getElementById("startBtn");

    startButton.disabled = true;

    startButton.textContent =
        "⏳ Simulation Running...";

    const result =
        updateRoute();

    highlightRoute();

    document.getElementById(
        "delay"
    ).textContent =
        result.cost * 2 + " ms";

    document.getElementById(
        "congestion"
    ).textContent =
        "MEDIUM";

    await transmitPackets();

    startButton.disabled = false;

    startButton.textContent =
        "↻ Run Simulation";
}

document.addEventListener(
    "DOMContentLoaded",
    function () {
        console.log(
            "NetFlow Go-Back-N Simulator loaded."
        );

        const startButton =
            document.getElementById("startBtn");

        if (startButton) {
            startButton.addEventListener(
                "click",
                startSimulation
            );
        }

        updateRoute();
    }
);