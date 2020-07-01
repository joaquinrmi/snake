class Color
{
    constructor(red, green, blue, alpha = 1)
    {
        this.r = red;
        this.g = green;
        this.b = blue;
        this.a = alpha;
    }

    toString()
    {
        return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
    }
}

const canvas = document.getElementById('game-canvas');
const backgroundCanvas = document.getElementById('background-canvas');
const scoreDisplay = document.getElementById('score');
const startGameOverlay = document.getElementById('game-start');
const gameOverOverlay = document.getElementById('game-over');

const ctx = canvas.getContext('2d');
const bgCtx = backgroundCanvas.getContext('2d');

const canvasW = canvas.width;
const canvasH = canvas.height;

const worldWidth = canvasW - 1;
const worldHeight = canvasH - 1;

const colorPalette = [
    new Color(31, 31, 31),
    new Color(77, 83, 60),
    new Color(139, 149, 109),
    new Color(196, 207, 161),
    new Color(255, 255, 255)
];

const backgroundColor = colorPalette[1];
const frameColor = colorPalette[0];
const textColor = colorPalette[4];
const emphasisTextColor = colorPalette[2];
const buttonColor = colorPalette[2];
const buttonTextColor = colorPalette[4];
const wormColor = colorPalette[3];
const foodColor = colorPalette[2];

const touchDeltaTreshold = window.innerHeight * .1;

var deltaTime;
var previousFrameEndTime;

var moveDirX;
var moveDirY;

var timeToMove;
var timeSinceLastMove;

var foodEaten;
var foodPos;

var imageData;

var touchPrevX;
var touchPrevY;

var touchDeltaX;
var touchDeltaY;

var nextMovement;

document.ontouchstart = function (event)
{ 
    touchPrevX = event.touches[0].screenX;
    touchPrevY = event.touches[0].screenY;

    touchDeltaX = touchDeltaY = 0;
}

document.ontouchmove = function (event)
{
    touchDeltaX += event.touches[0].screenX - touchPrevX;
    touchDeltaY += event.touches[0].screenY - touchPrevY;

    touchPrevX = event.touches[0].screenX;
    touchPrevY = event.touches[0].screenY;

    if(touchDeltaY <= -touchDeltaTreshold)
    {
        if(moveDir == "down") return;
        nextMovement = "up";
    }
    else if(touchDeltaX >= touchDeltaTreshold)
    {
        if(moveDir == "left") return;
        nextMovement = "right";
    }
    else if(touchDeltaY >= touchDeltaTreshold)
    {
        if(moveDir == "up") return;
        nextMovement = "down";
    }
    else if(touchDeltaX <= -touchDeltaTreshold) 
    {
        if(moveDir == "right") return;
        nextMovement = "left";
    }
}

document.onkeydown = function (event)
{
    switch (event.key)
    {
        case 'ArrowUp':
            if(moveDir == "down") return;
            nextMovement = "up";
            break;

        case 'ArrowRight':
            if(moveDir == "left") return;
            nextMovement = "right";
            break;

        case 'ArrowDown':
            if(moveDir == "up") return;
            nextMovement = "down";
            break;

        case 'ArrowLeft':
            if(moveDir == "right") return;
            nextMovement = "left";
            break;
    }
}

function setScore (score)
{
    scoreDisplay.textContent = score;
}

function drawPixel(x, y, color)
{
    imageData.data[ ( y * ( canvasW ) * 4 ) + ( x * 4 )     ] = color.r;
    imageData.data[ ( y * ( canvasW ) * 4 ) + ( x * 4 ) + 1 ] = color.g;
    imageData.data[ ( y * ( canvasW ) * 4 ) + ( x * 4 ) + 2 ] = color.b;
    imageData.data[ ( y * ( canvasW ) * 4 ) + ( x * 4 ) + 3 ] = color.a * 255;
}

class Pos
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }
}

class WormPiece
{
    constructor(pos, previous)
    {
        this.x = pos.x;
        this.y = pos.y;
        this.previous = previous;
    }
}

class Worm
{
    constructor(headPos, direction, large)
    {
        this.head = new WormPiece(headPos, undefined);

        var backPos = new Pos(headPos.x, headPos.y);

        var currentPiece = this.head;
        switch(direction)
        {
        case "up":
            currentPiece = this.createSomePieces(currentPiece, large, function(lastPos){
                lastPos.y -= 1;
            });
            break;

        case "down":
            currentPiece = this.createSomePieces(currentPiece, large, function(lastPos){
                lastPos.y += 1;
            });
            break;

        case "left":
            currentPiece = this.createSomePieces(currentPiece, large, function(lastPos){
                lastPos.x -= 1;
            });
            break;

        case "right":
            currentPiece = this.createSomePieces(currentPiece, large, function(lastPos){
                lastPos.x += 1;
            });
            break;
        }

        this.back = currentPiece;
    }

    move(direction)
    {
        switch(direction)
        {
        case "up":
            this.moveUp();
            break;

        case "down":
            this.moveDown();
            break;

        case "left":
            this.moveLeft();
            break;

        case "right":
            this.moveRight();
            break;
        }
    }

    moveUp()
    {
        this.fromLastToFirst(this.head.x, this.head.y - 1);
    }

    moveDown()
    {
        this.fromLastToFirst(this.head.x, this.head.y + 1);
    }

    moveLeft()
    {
        this.fromLastToFirst(this.head.x - 1, this.head.y);
    }

    moveRight()
    {
        this.fromLastToFirst(this.head.x + 1, this.head.y);
    }

    fromLastToFirst(x, y)
    {
        var piece = this.back;
        this.back = this.back.previous;

        piece.x = x;
        piece.y = y;

        this.head.previous = piece;
        this.head = piece;
        this.head.previous = undefined;
    }

    addNewPiece(position)
    {
        var newPiece = new WormPiece(position, undefined);
        this.head.previous = newPiece;
        this.head = newPiece;
    }

    addNewPieceAtBack(position)
    {
        var newPiece = new WormPiece(position, this.back);
        this.back = newPiece;
    }

    createSomePieces(currentPiece, large, posChanger)
    {
        var lastPos = new Pos(currentPiece.x, currentPiece.y);

        for(var i = 0; i < large; ++i)
        {
            posChanger(lastPos);

            currentPiece = new WormPiece(lastPos, currentPiece);
        }

        return currentPiece;
    }
}

var worm;
var world;
var availablePos;
var availablePosRegister;

function startGame()
{
    nextMovement = "up";
    moveDir = "up";

    timeToMove = 150;
    timeSinceLastMove = 0;
    foodEaten = 0;

    world = new Array(worldWidth * worldHeight);
    availablePos = [];
    availablePosRegister = new Array(worldWidth * worldHeight);

    for(var y = 1; y < worldHeight; ++y)
    {
        for(var x = 1; x < worldWidth; ++x)
        {
            addAvailablePos(x, y);
        }
    }

    worm = new Worm(new Pos(Math.floor(worldWidth / 2), Math.floor(worldHeight / 2)), "left", 2);

    var wormPiece = worm.back;
    while(wormPiece)
    {
        removeAvailablePos(wormPiece.x, wormPiece.y);
        wormPiece = wormPiece.previous;
    }

    foodPos = [];

    spawnFood();

    startGameOverlay.classList.add('hidden');
    gameOverOverlay.classList.remove('visible');

    deltaTime = 0;

    setScore(0);

    canvas.classList.remove('hidden');

    previousFrameEndTime = Date.now();
    window.requestAnimationFrame(gameLoop);
}

function removeAvailablePos(x, y)
{
    var pos = y * (worldWidth - 1) + x;

    world[pos] = true;

    var registerPos = availablePosRegister[pos];
    availablePos.splice(registerPos, 1);
}

function addAvailablePos(x, y)
{
    var pos = y * (worldWidth - 1) + x;

    world[pos] = false;

    var registerPos = availablePos.length;
    availablePos.push(new Pos(x, y));
    availablePosRegister[pos] = registerPos;
}

function checkAvailablePos(x, y)
{
    return !world[y * (worldWidth - 1) + x];
}

function endGame()
{
    gameOverOverlay.classList.add('visible');
    canvas.classList.add('hidden');
}

function spawnFood ()
{
    foodPos = availablePos[Math.floor(Math.random() * availablePos.length)];

    removeAvailablePos(foodPos.x, foodPos.y);
}

if(!('imageRendering' in document.body.style))
{  
    alert('Este juego no es compatible con tu navegador, prueba ejecutarlo en una version reciente de Firefox o Chrome');
}

bgCtx.imageSmoothingEnabled = false;
canvas.imageSmoothingEnabled = false;

document.body.style.backgroundColor = backgroundColor.toString();
document.body.style.color = textColor.toString();

var start_button = document.getElementsByClassName("start-button");
for(var i = 0; i < start_button.length; ++i)
{
    start_button[i].style.backgroundColor = buttonColor.toString();
    start_button[i].style.color = buttonTextColor.toString();
}

document.getElementById("worm").style.color = wormColor.toString();
document.getElementById("food").style.color = foodColor.toString();

bgCtx.strokeStyle = frameColor.toString();
bgCtx.strokeRect(0.5, 0.5, backgroundCanvas.width - 1, backgroundCanvas.height - 1);

function gameLoop ()
{
    deltaTime = Date.now() - previousFrameEndTime;
    imageData = ctx.createImageData(canvasW, canvasH);

    timeSinceLastMove += deltaTime;
    if (timeSinceLastMove > timeToMove) 
    {
        timeSinceLastMove = 0;

        var lastBackPos = new Pos(worm.back.x, worm.back.y);

        moveDir = nextMovement;
        worm.move(moveDir);

        var headPos = new Pos(worm.head.x, worm.head.y);

        if (headPos.x < 1 || headPos.x > canvasW - 2 || headPos.y < 1 || headPos.y > canvasW - 2)
        {
            endGame();
            return;
        }

        if(foodPos.x == headPos.x && foodPos.y == headPos.y)
        {
            addAvailablePos(foodPos.x, foodPos.y);

            setScore(++foodEaten);
            spawnFood();
            
            timeToMove = ( 400 / Math.log( foodEaten + 15 ));
            
            worm.addNewPieceAtBack(lastBackPos);
        }
        else
        {
            addAvailablePos(lastBackPos.x, lastBackPos.y);

            if(!checkAvailablePos(headPos.x, headPos.y))
            {
                endGame();
                return;
            }
        }

        removeAvailablePos(headPos.x, headPos.y);
    }

    var wormPiece = worm.back;
    while(wormPiece)
    {
        drawPixel(wormPiece.x, wormPiece.y, wormColor);
        wormPiece = wormPiece.previous;
    }

    drawPixel(foodPos.x, foodPos.y, foodColor);

    ctx.putImageData(imageData, 0, 0);

    keyPressed = null;
    previousFrameEndTime = Date.now();
    window.requestAnimationFrame(gameLoop);
}