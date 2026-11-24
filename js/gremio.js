const cellSize = 40;

// Posiciona toda la casa dentro del terreno
const houseOffsetX = 6;
const houseOffsetY = 2;

const rooms = [

{
    name: "Dormitorio A",
    x: 0,
    y: 0,
    w: 10,
    h: 4
},

{
    name: "Dormitorio B",
    x: 10,
    y: 0,
    w: 10,
    h: 4
},

{
    name: "Baño",
    x: 0,
    y: 4,
    w: 4,
    h: 4
},

{
    name: "Cuarto Libre",
    x: 0,
    y: 8,
    w: 6,
    h: 5
},

{
    name: "Sala Principal",
    type: "hall",
    x: 6,
    y: 5,
    w: 14,
    h: 8
},

{
    name: "Entrada",
    type: "entry",
    x: 0,
    y: 13,
    w: 20,
    h: 3
}

];

const objects = [

{
    id: 1,

    type: "bed",

    name: "Cama de Pulfa",

    owner: "Pulfa",

    description: "Cama personalizada con manta negra.",

    x: 2,
    y: 1,

    container: false
},

{
    id: 2,

    type: "chest",

    name: "Baúl de Vesper",

    owner: "Vesper",

    description: "Objetos personales.",

    x: 12,
    y: 2,

    container: true,

    items: [
        {
            name: "Escama Negra",
            quantity: 2
        }
    ]
}

];

const icons = {

    bed: "🛏",

    chest: "📦",

    bookshelf: "📚",

    chair: "🪑",

    desk: "🗄",

    table: "🪵"
};

const grid = document.getElementById("guild-grid");

renderRooms();
renderObjects();

function renderRooms() {

    rooms.forEach(room => {

        const div = document.createElement("div");

        div.className = "room";

        div.style.left =
            `${(room.x + houseOffsetX) * cellSize}px`;

        div.style.top =
            `${(room.y + houseOffsetY) * cellSize}px`;

        div.style.width =
            `${room.w * cellSize}px`;

        div.style.height =
            `${room.h * cellSize}px`;

        if (room.type === "hall") {

            div.style.background =
                "rgba(180,140,60,.18)";
        }

        if (room.type === "entry") {

            div.style.background =
                "rgba(54,90,145,.10)";
        }

        div.textContent = room.name;

        grid.appendChild(div);

    });

}

function renderObjects() {

    objects.forEach(obj => {

        const div = document.createElement("div");

        div.className = "object";

        div.style.left =
            `${(obj.x + houseOffsetX) * cellSize}px`;

        div.style.top =
            `${(obj.y + houseOffsetY) * cellSize}px`;

        div.title = obj.name;

        div.innerHTML = `
            <div>
                ${icons[obj.type] ?? "❓"}
            </div>
        `;

        div.addEventListener("click", () => {

            showProperties(obj);

        });

        grid.appendChild(div);

    });

}

function showProperties(obj) {

    let html = `

    <div class="property-card">

        <h3>${obj.name}</h3>

        <p>

            <strong>Propietario:</strong>
            ${obj.owner ?? "Nadie"}

        </p>

        <p>

            ${obj.description ?? ""}

        </p>
    `;

    if (obj.container) {

        html += `
            <h4>Contenido</h4>
        `;

        obj.items.forEach(item => {

            html += `
                <div class="inventory-item">
                    ${item.name} x${item.quantity}
                </div>
            `;

        });

        html += `
            <div class="inventory-actions">
                <button id="add-item-btn">
                    Agregar Objeto
                </button>
            </div>
        `;
    }

    html += `
    </div>
    `;

    document.getElementById(
        "selected-object"
    ).innerHTML = html;

}
