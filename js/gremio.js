const cellSize = 32;

const rooms = [

{
    name:"Dormitorio A",
    x:0,
    y:0,
    w:8,
    h:4
},

{
    name:"Dormitorio B",
    x:8,
    y:0,
    w:12,
    h:4
},

{
    name:"Baño",
    x:0,
    y:4,
    w:4,
    h:4
},

{
    name:"Biblioteca / Almacén",
    x:4,
    y:4,
    w:6,
    h:4
},

{
    name:"Sala Principal",
    type:"hall",
    x:0,
    y:8,
    w:20,
    h:5
},

{
    name:"Entrada",
    type:"entry",
    x:0,
    y:13,
    w:20,
    h:2
}

];

const objects = [

{
    id:1,

    type:"bed",

    name:"Cama de Pulfa",

    owner:"Pulfa",

    description:"Cama personalizada con manta negra.",

    x:2,

    y:1,

    container:false
},

{
    id:2,

    type:"chest",

    name:"Baúl de Vesper",

    owner:"Vesper",

    description:"Objetos personales.",

    x:11,

    y:2,

    container:true,

    items:[
        {
            name:"Escama Negra",
            quantity:2
        }
    ]
}

];

const icons = {

    bed:"🛏",

    chest:"📦",

    bookshelf:"📚",

    chair:"🪑",

    desk:"🗄",

    table:"🪵"

};

const grid = document.getElementById("guild-grid");

renderRooms();
renderDoors();
renderObjects();

function renderRooms(){

    rooms.forEach(room=>{

        const div = document.createElement("div");

        div.className = "room";

        div.style.left =
            `${room.x * cellSize}px`;

        div.style.top =
            `${room.y * cellSize}px`;

        div.style.width =
            `${room.w * cellSize}px`;

        div.style.height =
            `${room.h * cellSize}px`;

        if(room.type === "hall"){

            div.style.background =
                "rgba(180,140,60,.18)";
        }

        if(room.type === "entry"){

            div.style.background =
                "rgba(70,120,180,.18)";
        }

        div.textContent = room.name;

        grid.appendChild(div);

    });
}

function renderDoors(){

    const doors = [

        // Dormitorio A -> Sala

        {
            x:4,
            y:8,
            horizontal:true
        },

        // Dormitorio B -> Sala

        {
            x:14,
            y:8,
            horizontal:true
        },

        // Baño -> Sala

        {
            x:4,
            y:6,
            horizontal:false
        },

        // Biblioteca -> Sala

        {
            x:10,
            y:6,
            horizontal:false
        },

        // Entrada -> Sala

        {
            x:10,
            y:13,
            horizontal:true
        }

    ];

    doors.forEach(door=>{

        const div = document.createElement("div");

        div.className = "door";

        if(door.horizontal){

            div.style.width = "32px";
            div.style.height = "6px";
        }
        else{

            div.style.width = "6px";
            div.style.height = "32px";
        }

        div.style.left =
            `${door.x * cellSize - 3}px`;

        div.style.top =
            `${door.y * cellSize - 3}px`;

        grid.appendChild(div);

    });

}

function renderObjects(){

    objects.forEach(obj=>{

        const div = document.createElement("div");

        div.className = "object";

        div.style.left =
            `${obj.x * cellSize}px`;

        div.style.top =
            `${obj.y * cellSize}px`;

        div.title = obj.name;

        div.innerHTML = `

            <div>

                ${icons[obj.type] ?? "❓"}

            </div>

        `;

        div.addEventListener("click",()=>{

            showProperties(obj);

        });

        grid.appendChild(div);

    });

}

function showProperties(obj){

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

    if(obj.container){

        html += `

        <h4>Contenido</h4>

        `;

        obj.items.forEach(item=>{

            html += `

            <div class="inventory-item">

                ${item.name}

                x${item.quantity}

            </div>

            `;

        });

        html += `

        <div class="inventory-actions">

            <button>

                Agregar Objeto

            </button>

        </div>

        `;
    }

    html += `

    </div>

    `;

    document
        .getElementById("selected-object")
        .innerHTML = html;
}