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
        moveDirY = -1; moveDirX = 0; touchDeltaX = touchDeltaY = 0;
    }
    else if(touchDeltaX >= touchDeltaTreshold)
    {
        moveDirX =  1; moveDirY = 0; touchDeltaX = touchDeltaY = 0;
    }
    else if(touchDeltaY >= touchDeltaTreshold)
    {
        moveDirY =  1; moveDirX = 0; touchDeltaX = touchDeltaY = 0;
    }
    else if(touchDeltaX <= -touchDeltaTreshold) 
    {
        moveDirX = -1; moveDirY = 0; touchDeltaX = touchDeltaY = 0;
    }
}

document.onkeydown = function (event)
{
    switch (event.key)
    {
        case 'ArrowUp':
            moveDirY = -1; moveDirX = 0;
            break;

        case 'ArrowRight':
            moveDirX =  1; moveDirY = 0;
            break;

        case 'ArrowDown':
            moveDirY =  1; moveDirX = 0;
            break;

        case 'ArrowLeft':
            moveDirX = -1; moveDirY = 0;
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

function SnakePiece(x, y, previous) {
    this.x = x;
    this.y = y;

    this.previous = previous;
}

function Pos(x, y)
{
    this.x = x;
    this.y = y;
}

function startGame()
{
    moveDirX = 0;
    moveDirY = -1;

    timeToMove = 150;
    timeSinceLastMove = 0;
    foodEaten = 0;

    availablePos = [];
    for (var i = 1; i < canvasH - 1; i++)
    {
        for (var j = 1; j < canvasW - 1; j++)
        {
            availablePos.push(new Pos(j, i));
        }
    }

    head = new SnakePiece(15, 15, new SnakePiece(14, 15, new SnakePiece(13, 15, null)));
    removeAvailablePos(15, 15);
    removeAvailablePos(14, 15);
    removeAvailablePos(13, 15); 

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

function removeAvailablePos (x, y)
{
    for (var i = 0; i < availablePos.length; i++)
    { 
        if (availablePos[i].x === x && availablePos[i].y === y)
        {
            availablePos.splice(i, 1);
            break;
        }
    }
}

function endGame()
{
    gameOverOverlay.classList.add('visible');
    canvas.classList.add('hidden');
}

function spawnFood ()
{
    foodPos = availablePos[Math.round(Math.random() * (availablePos.length - 1))];

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

        var prevPieceX = head.x;
        var prevPieceY = head.y;

        head.x += moveDirX;
        head.y += moveDirY;

        if (head.x < 1 || head.x > canvasW - 2 || head.y < 1 || head.y > canvasW - 2)
        {
            endGame();
            return;
        }

        var snakePiece = head.previous;
        while (snakePiece)
        {
            if (head.x === snakePiece.x && head.y === snakePiece.y)
            {
                if ( snakePiece === head.previous )
                {
                    moveDirX *= -1;
                    moveDirY *= -1;

                    head.x = prevPieceX + moveDirX;
                    head.y = prevPieceY + moveDirY;

                    break;
                }
                endGame();
                return;
            }

            snakePiece = snakePiece.previous;
        } 

        var hasEaten = false;
        if (foodPos.x === head.x && foodPos.y === head.y )
        {
            setScore(++foodEaten);
            spawnFood();
            
            timeToMove = ( 400 / Math.log( foodEaten + 15 ));
            
            hasEaten = true;
        }

        removeAvailablePos(head.x, head.y);

        var snakePiece = head.previous;
        while (snakePiece)
        {
            var auxX = snakePiece.x;
            var auxY = snakePiece.y;

            snakePiece.x = prevPieceX;
            snakePiece.y = prevPieceY;

            prevPieceX = auxX;
            prevPieceY = auxY;

            if (!snakePiece.previous)
            {
                if (hasEaten)
                {
                    snakePiece.previous = new SnakePiece(auxX, auxY, null);
                    break;
                }
                else
                {
                    availablePos.push(new Pos(auxX, auxY));
                }
            }

            snakePiece = snakePiece.previous;
        }
    }

    var curSnakePiece = head;
    while(curSnakePiece)
    {
        drawPixel(curSnakePiece.x, curSnakePiece.y, wormColor);
        curSnakePiece = curSnakePiece.previous;
    }

    drawPixel(foodPos.x, foodPos.y, foodColor);

    ctx.putImageData(imageData, 0, 0);

    keyPressed = null;
    previousFrameEndTime = Date.now();
    window.requestAnimationFrame(gameLoop);
}