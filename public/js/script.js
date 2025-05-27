const socket = io();

const map = L.map("map").setView([0, 0], 16);

// ✅ Fixed tile layer URL `{S}` → `{s}`
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
}).addTo(map);

const markers = {};

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("send-location", { latitude, longitude });
        },
        (error) => {
            console.error("Geolocation error:", error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
}

socket.on("receive-location", ({ id, latitude, longitude }) => {
    if (!markers[id]) {
        const marker = L.marker([latitude, longitude]).addTo(map);
        marker.bindPopup(id === socket.id ? "You" : `User: ${id}`).openPopup();
        markers[id] = marker;
    } else {
        markers[id].setLatLng([latitude, longitude]);
    }

    if (id === socket.id) {
        map.setView([latitude, longitude], 16);
    }
});


socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});
