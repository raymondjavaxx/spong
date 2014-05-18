/**
 * Copyright (c) 2011 Ramon Torres
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var Spong = (function(){

	var canvas;
	var ctx;
	var screenW;
	var screenH;

	var Sounds = (function() {
		var bop  = new Audio('sfx/bop.wav');
		var beep = new Audio('sfx/beep.wav');
		return {
			bop:bop,
			beep:beep
		};
	})();

	var keyboardState = {up:false, down:false};

	var pads = {
		one: {x:32, y: 32, w: 16, h:64},
		two: {x:32, y: 32, w: 16, h:64}
	};

	var players = {one:{score:3}, two:{score:0}};

	var ball = {x:10, y:10, w:16, h:16, velocity:{x:5, y:5}};
	ball.collidesWith = function(pad) {
		if ((this.x + this.w >= pad.x) &&
		    (this.x <= pad.x + pad.w) &&
		    (this.y + this.h >= pad.y) &&
		    (this.y <= pad.y + pad.h)) {
			return true;
		}

		return false;
	};

	var Graphics = (function(){
		var font = [
			[[1,1,1,1], [1,0,0,1], [1,0,0,1], [1,0,0,1], [1,0,0,1], [1,1,1,1]], // 0
			[[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]], // 1
			[[1,1,1,1], [0,0,0,1], [1,1,1,1], [1,0,0,0], [1,0,0,0], [1,1,1,1]], // 2
			[[1,1,1,1], [0,0,0,1], [0,1,1,1], [0,0,0,1], [0,0,0,1], [1,1,1,1]], // 3
			[[1,0,0,1], [1,0,0,1], [1,1,1,1], [0,0,0,1], [0,0,0,1], [0,0,0,1]], // 4
			[[1,1,1,1], [1,0,0,0], [1,1,1,1], [0,0,0,1], [0,0,0,1], [1,1,1,1]], // 5
			[[1,1,1,1], [1,0,0,0], [1,1,1,1], [1,0,0,1], [1,0,0,1], [1,1,1,1]], // 6
			[[1,1,1,1], [0,0,0,1], [0,0,1,0], [0,0,1,0], [0,1,0,0], [0,1,0,0]], // 7
			[[1,1,1,1], [1,0,0,1], [1,1,1,1], [1,0,0,1], [1,0,0,1], [1,1,1,1]], // 8
			[[1,1,1,1], [1,0,0,1], [1,1,1,1], [0,0,0,1], [0,0,0,1], [0,0,0,1]], // 8
		];

		var drawNumber = function(number, offsetX, offsetY) {
			ctx.fillStyle = 'rgb(255, 255, 255)';

			var bitmap = font[number];
			for (var y = bitmap.length - 1; y >= 0; y--){
				for (var x = bitmap[y].length - 1; x >= 0; x--){
					if (bitmap[y][x] == 1) {
						//ctx.fillRect(offsetX + x*16, offsetY + y*16, 16, 16);
					}
				};
			};
		};

		var clear = function() {
			ctx.fillStyle = '#000';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		};

		var drawPads = function() {
			ctx.fillStyle = '#fff';
			ctx.fillRect(pads.one.x, pads.one.y, pads.one.w, pads.one.h);
			ctx.fillRect(pads.two.x, pads.two.y, pads.two.w, pads.two.h);
		};

		var drawBall = function() {
			ctx.fillStyle = '#fff';
			ctx.fillRect(ball.x, ball.y, 16, 16);
		};

		var drawNet = function() {
			var x = ((screenW / 2) - 4);
			for (var y = (screenH - 64); y >= 0; y-=48){
				//ctx.fillRect(x, y, 8, 24);
			}
		};

		var drawScanlines = function() {
			ctx.save();
			ctx.beginPath();
	
			for (var y=0.4; y < screenH; y+=2) {
				ctx.moveTo(0, y);
				ctx.lineTo(screenW, y);
			}

			ctx.lineWidth = 1;
			ctx.lineCap = 'butt';
			ctx.strokeStyle = '#000';
			ctx.stroke();
			ctx.restore();
		};

		var shader = function () {
			var offset;
			var data = ctx.getImageData(0, 0, screenW, screenH);

			for (var x = 0; x < data.width; x+=1) {
				for (var y = 0; y < data.height; y+=1) {
					offset = ((x*4) + (y * screenW * 4));
					if ((y % 2) === 0) {
						data.data[offset + 0] = data.data[offset + 0] * 0.5;
						data.data[offset + 1] = data.data[offset + 1] * 0.5;
						data.data[offset + 2] = data.data[offset + 2] * 0.5;
						data.data[offset + 3] = data.data[offset + 3] * 0.5;
					}
				};
			};

			ctx.putImageData(data, 0, 0);
		};

		var draw = function() {
			clear();
			drawPads();
			drawBall();
			drawNet();
			drawNumber(players.one.score, ((screenW / 2) - 4) - 240, 30);
			drawNumber(players.two.score, ((screenW / 2) - 4) + 176, 30);
			//drawScanlines();
			//shader();
		};

		return {draw:draw};
	})();

	var init = function(canvasId){	
		canvas = document.getElementById(canvasId);
		canvas.focus();

		screenW = canvas.width;
		screenH = canvas.height;

		pads.one.x = 150;
		pads.one.y = ((screenH/2) - (pads.two.h/2));

		pads.two.x = (screenW - 150) - pads.two.w;
		pads.two.y = ((screenH/2) - (pads.two.h/2));
		
		ball.x = (canvas.width / 2) - 150;

		ctx = canvas.getContext('2d');

		document.onkeypress = function(e){
			var key = e.keyCode? e.keyCode : e.charCode;
			if (key == 38) {
				keyboardState.down = true;
			} else if (key == 40) {
				keyboardState.up = true;
			}
		};

		document.onkeyup = function(e){
			var key = e.keyCode? e.keyCode : e.charCode;
			
			var data = {delta:100};

			if (key == 38) {
				keyboardState.down = false;
			} else if (key == 40) {
				keyboardState.up = false;
			}
		};

		// Game loop
		var doFrame = function (time) {
			handleInput();
			doPhysics();
			Graphics.draw();
			window.requestAnimationFrame(doFrame);
		};

		window.requestAnimationFrame(doFrame);
	};

	var handleInput = function() {
		var kDelta = 8;

		if (keyboardState.up) {
			pads.one.y += kDelta;
		} else if (keyboardState.down) {
			pads.one.y -= kDelta;
		}
	};

	var doPhysics = function() {
		if (pads.one.y < 0) { pads.one.y = 0; }
		if (pads.one.y + pads.one.h > screenH) { pads.one.y = screenH - pads.one.h; }

		if (pads.two.y < 0) { pads.two.y = 0; }
		if (pads.two.y + pads.two.h > screenH) { pads.two.y = screenH - pads.two.h; }

		if (ball.y >= screenH - ball.h) {
			ball.velocity.y *= -1;
			//Sounds.bop.play();
		}

		if (ball.x >= screenW - ball.h) {
			ball.velocity.x *= -1;
			//Sounds.bop.play();
		}

		if (ball.y <= 0) {
			ball.velocity.y *= -1;
			//Sounds.bop.play();
		}

		if (ball.x <= 0) {
			ball.velocity.x *= -1;
			//Sounds.bop.play();
		}

		if (ball.collidesWith(pads.one) || ball.collidesWith(pads.two)) {
			ball.velocity.x *= -1;
			//ball.velocity.y *= -1;
			//Sounds.beep.play();
		}

		ball.x += ball.velocity.x;
		ball.y += ball.velocity.y;
	};

	return {init:init, handleInput:handleInput};
})();

