function Vector(x, y) {
    this.x = x;
    this.y = y;

    this.add = function(vector) {
        this.x += vector.x;
        this.y += vector.y;
    }

    this.flipX = function() {
        this.x = this.x * -1.0;
    }

    this.flipY = function() {
        this.y = this.y * -1.0;
    }

    this.toString = function() {
        return "Vector(" + this.x + "," + this.y + ")";
    }

}

function Rect(x, y, width, height) {
    Rect.NORTH = 1;
    Rect.SOUTH = 2;
    Rect.WEST = 4;
    Rect.EAST = 8;

    this.upper = new Vector(x, y);
    this.width = width;
    this.height = height;

    this.north = function() {
        return this.upper.y;
    }

    this.south = function() {
        return this.upper.y + this.height;
    }

    this.west = function() {
        return this.upper.x;
    }

    this.east = function() {
        return this.upper.x + this.width;
    }

    this.corners = function() {
        return new Array(
        this.upper,
        new Vector(this.upper.x + this.width, this.upper.y),
        new Vector(this.upper.x + this.width, this.upper.y + this.height),
        new Vector(this.upper.x, this.upper.y + this.height));
    }

    this.isPointInside = function(point) {
        if (this.upper.x <= point.x
        && this.upper.x + this.width >= point.x
        && this.upper.y <= point.y
        && this.upper.y + this.height >= point.y) return true;
        return false;
    }

    this.isInside = function(rect) {
        var result = 0;
        if (this.north() > rect.north()) result |= Rect.NORTH;
        if (this.south() < rect.south()) result |= Rect.SOUTH;
        if (this.west() > rect.west()) result |= Rect.WEST;
        if (this.east() < rect.east()) result |= Rect.EAST;
        return result;
    }

    this.isHit = function(rect) {
        var corners = rect.corners();
        for (i in corners) {
            if (this.isPointInside(corners[i])) return true;
        }
        return false;
    }

    this.draw = function(ctx) {
        ctx.fillStyle = "red";
        ctx.fillRect(this.upper.x, this.upper.y, this.width, this.height);
    }

    this.toString = function() {
        return "Rect(" + this.upper.x + "," + this.upper.y + "," + (this.upper.x + this.width) + "," + (this.upper.y + this.height) + ")";
    }

}

function Ball(radius, position, velocity) {
    this.radius = radius;
    this.position = position;
    this.velocity = velocity;

    this.hitBox = function() {
        return new Rect(this.position.x - this.radius, this.position.y - this.radius, 2.0 * radius, 2.0 * radius);
    }

    this.tick = function() {
        this.position.add(this.velocity);
    }

    this.draw = function(ctx) {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, true);
        ctx.fill();
    }

    this.movingNorth = function() {
        return this.velocity.y < 0;
    }

    this.movingSouth = function() {
        return ! this.movingNorth();
    }

    this.movingWest = function() {
        return this.velocity.x < 0;
    }

    this.movingEast = function() {
        return ! this.movingWest();
    }

    this.toString = function() {
        return "Ball(" + this.radius + "," + this.position + "," + this.velocity + ")";
    }

}

function Paddel(width, height, position) {
    this.width = width;
    this.height = height;
    this.position = position;

    this.tick = function(input, player) {
        if (input.getKeyForPlayer(player) == input.UP) {
            this.position.y += 100;
            console.debug("Move paddle" + player + " up");
        } else if (input.getKeyForPlayer(player) == input.DOWN) {
            this.position.y -= 100;
            console.debug("Move paddel " + player + " down");
        }
    }

    this.hitBox = function() {
        return new Rect(this.position.x, this.position.y, this.width, this.height);
    }

    this.draw = function(ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

}

function Level(width, height) {
    this.width = width;
    this.height = height;

    this.ball = new Ball(10, new Vector(20, 20), new Vector(11, 13));
    this.paddels = [new Paddel(20, 150, new Vector(50, this.height / 2 - 75)),
    new Paddel(20, 150, new Vector(this.width - 70, this.height / 2 - 75))];
    this.scores = [0, 0];

    this.draw = function(context) {
        context.fillStyle = "rgb(17,17,17)";
        context.fillRect(0, 0, this.width, this.height);

        // halfs
        context.beginPath();
        context.strokeStyle = "white";
        context.moveTo(this.width / 2, 2)
        for (var dx = 2; dx <= this.height; dx += 2) {
            if (dx % 10 != 0) {
                context.lineTo(this.width / 2, dx);
            } else {
                context.moveTo(this.width / 2, dx);
            }
        }
        context.stroke();

        // Scores
        context.fillStyle = "rgb(168, 168, 168)";
        context.font = "bold 60px monospace";
        context.textBaseline = "top";
        context.fillText(this.scores[0], this.width / 2 - 100, 20);
        context.fillText(this.scores[1], this.width / 2 + 60, 20);

        this.ball.draw(context);
        for (x in this.paddels) {
            this.paddels[x].draw(context);
        }
    };

    this.tick = function(input) {
        this.paddels[0].tick(input, input.PLAYER1);
        this.paddels[1].tick(input, input.PLAYER2);
        this.ball.tick();

        // Hit walls?
        var isInside = this.hitBox().isInside(this.ball.hitBox());
        if ((isInside & Rect.NORTH) || (isInside & Rect.SOUTH)) {
            this.ball.velocity.flipY();
        }
        if ((isInside & Rect.EAST) || (isInside & Rect.WEST)) {
            this.ball.velocity.flipX();
            if ((isInside & Rect.EAST) != 0) {
                this.scores[1] = this.scores[1] + 1;
            } else {
                this.scores[0] = this.scores[0] + 1;
            }
        }

        // Hit paddel?
        for (x in this.paddels) {
            var isHit = this.paddels[x].hitBox().isHit(this.ball.hitBox());
            if (isHit) {
                var corner = this.paddels[x].hitBox().isInside(this.ball.hitBox());
                var N = (corner & Rect.NORTH) != 0 && this.ball.movingSouth();
                var E = (corner & Rect.EAST) != 0 && this.ball.movingWest();
                var S = (corner & Rect.SOUTH) != 0 && this.ball.movingNorth();
                var W = (corner & Rect.WEST) != 0 && this.ball.movingEast();
                //console.log("Corners {N:"+N+", E:"+E+", S:"+S+", W:"+W+"}")
                // S und N haben vorrang
                if (S || N) {
                    this.ball.velocity.flipY();
                } else {
                    if (E || W) {
                        this.ball.velocity.flipX();
                    }
                }
            }
        }

    }

    this.hitBox = function() {
        return new Rect(0, 0, this.width, this.height);
    }
}

function Pong(context, input) {
    this.context = context;
    this.input = input;

    this.level = new Level(context.canvas.width, context.canvas.height);

    this.tick = function() {
        this.level.tick(input);
        this.level.draw(context);

        //reset events
        this.input.clear();

        window.setTimeout("pong.tick()", 30);
    }

}

function Input() {
    this.UP = 1;
    this.DOWN = -1;
    this.NONE = 0;

    this.PLAYER1 = 1;
    this.PLAYER2 = 2;

    this.p1_button = this.NONE;
    this.p2_button = this.NONE;

    this.updatePlayer = function(player, key) {
        if (player == this.PLAYER1) {
            this.p1_button = key;
        } else if (player == this.PLAYER2) {
            this.p2_button = key;
        }
    }

    this.getKeyForPlayer = function(player) {
        if (player == this.PLAYER1) return this.p1_button;
        if (player == this.PLAYER2) return this.p2_button;
        return this.NONE;
    }

    this.clear = function() {
        this.p1_button = this.NONE;
        this.p2_button = this.NONE;
    }
}

// Globals
var pong = null;
var input = new Input();

function startGame() {
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");

    // start the game
    pong = new Pong(context, input);
    window.setTimeout("pong.tick()", 30);
}
window.addEventListener("load", startGame, false);

function updateInput(event) {
    var key = event.keyCode || event.which;
    if (74 == key) {
        input.updatePlayer(input.PLAYER2, input.UP);
    } else if (75 == key) {
        input.updatePlayer(input.PLAYER2, input.DOWN);
    }
    if (68 == key) {
        input.updatePlayer(input.PLAYER1, input.UP);
    } else if (70 == key) {
        input.updatePlayer(input.PLAYER1, input.DOWN);
    }
}
window.addEventListener("keydown", updateInput);