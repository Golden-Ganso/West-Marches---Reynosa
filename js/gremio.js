const cellSize = 40;

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
    h:3
},

{
    name:"Cuarto Libre",
    x:0,
    y:7,
    w:6,
    h:5
},

{
    name:"Sala Principal",
    x:6,
    y:3,
    w:14,
    h:9
}

];

const objects = [

{
    id:1,

    type:"bed",

    name:"Cama de Pulfa",

    owner:"Pulfa",

    description:"Cama personalizada.",

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

    x:10,
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

const grid = document.getElementById("guild-grid");

renderRooms();
renderObjects();

function renderRooms(){

    rooms.forEach(room => {

        const div = document.createElement("div");

        div.className = "room";

        div.style.left = `${room.x * cellSize}px`;
        div.style.top = `${room.y * cellSize}px`;

        div.style.width = `${room.w * cellSize}px`;
        div.style.height = `${room.h * cellSize}px`;

        div.innerText = room.name;

        grid.appendChild(div);

    });

}

function renderObjects(){

    objects.forEach(obj => {

        const div = document.createElement("div");

        div.className="object";

        div.style.left=`${obj.x * cellSize}px`;
        div.style.top=`${obj.y * cellSize}px`;

        div.innerText=obj.type;

        div.addEventListener("click",()=>{

            showProperties(obj);

        });

        grid.appendChild(div);

    });

}

function showProperties(obj){

    let html = `
        <h3>${obj.name}</h3>

        <p>
            <b>Propietario:</b>
            ${obj.owner ?? "Nadie"}
        </p>

        <p>
            ${obj.description ?? ""}
        </p>
    `;

    if(obj.container){

        html += "<h4>Contenido</h4>";

        obj.items.forEach(item => {

            html += `
                <p>
                    ${item.name}
                    x${item.quantity}
                </p>
            `;

        });

    }

    document.getElementById("selected-object").innerHTML = html;

}