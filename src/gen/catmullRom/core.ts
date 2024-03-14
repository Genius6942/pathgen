import { Point } from "$utils";

export class CatmullRom{
		points: Point[];
		injected: [number, Point, number][];

		constructor(points: Point[], injected = [] as [number, Point, number][]){
				this.points = points;
				this.injected = injected;
		}

		addGhostPoints(){
				const first = this.points[0];
				const second = this.points[1];
				const secondToLast = this.points[this.points.length - 2];
				const last = this.points[this.points.length - 1];
				
				this.points.unshift(Point.subtract(first.multiply(2), second));
				this.points.push(Point.subtract(last.multiply(2), secondToLast));
				
				return this;
		}

		
		evaluate(p0: Point, p1: Point, p2: Point, p3: Point, t: number) {
				const c0 = p1;
				const c1 = Point.sum(p0.multiply(-0.5), p2.multiply(0.5));
				const c2 = Point.sum(p0, p1.multiply(-2.5), p2.multiply(2), p3.multiply(-0.5)); 
				const c3 = Point.sum(p0.multiply(-0.5), p1.multiply(1.5), p2.multiply(-1.5), p3.multiply(0.5));
			
				const t2 = t * t;
				const t3 = t2 * t;
			
				return Point.sum(c0, c1.multiply(t), c2.multiply(t2), c3.multiply(t3));
				
		}

		derivative(p0: Point, p1: Point, p2: Point, p3: Point, t: number){
				const c1 = Point.sum(p0.multiply(-0.5), p2.multiply(0.5));
				const c2 = Point.sum(p0.multiply(2), p1.multiply(-5), p2.multiply(4), p3.multiply(-1));
				const c3 = Point.sum(p0.multiply(-1.5), p1.multiply(4.5), p2.multiply(-4.5), p3.multiply(1.5));
			
				const t2 = t * t;
			
				return Point.sum(c1, c2.multiply(t), c3.multiply(t2));
		}

		derivative2(p0: Point, p1: Point, p2: Point, p3: Point, t: number){
				const c2 = Point.sum(p0.multiply(2), p1.multiply(-5), p2.multiply(4), p3.multiply(-1));
				const c3 = Point.sum(p0.multiply(-3), p1.multiply(9), p2.multiply(-9), p3.multiply(3));

				return Point.sum(c2, c3.multiply(t));
		}
		
		curvature(p0: Point, p1: Point, p2: Point, p3: Point, t: number){
				const firstDPoint = this.derivative(p0, p1, p2, p3, t);
				const secondDPoint = this.derivative2(p0, p1, p2, p3, t);
				const numerator = firstDPoint.x * secondDPoint.y - firstDPoint.y * secondDPoint.x;
				const denominator = Math.pow(firstDPoint.magnitude(), 3);
				return numerator / denominator;
		}
	 

		speeds(maxAccel: number){
				
				for(let i = this.injected.length - 1; i > 0; i--){
						const dist = Point.distance(this.injected[i][1], this.injected[i - 1][1]);
						let newVel = Math.sqrt(2 * maxAccel * dist + Math.pow(this.injected[i][2], 2));
						newVel = Math.min(newVel, this.injected[i - 1][2]);
						this.injected[i - 1][2] = newVel;
				}
				return this;
		}


		generatePath(maxVel: number, maxAccel: number, k = 3){
				this.addGhostPoints();
				const path: typeof this.injected = [];
				for(let i = 0; i < this.points.length - 3; i++){
						const dist = Point.distance(this.points[i + 1], this.points[i + 2]);
						for(let j = 0; j < dist; j++){
								const t = j / Math.floor(dist);
								const cur = Math.abs(this.curvature(this.points[i], this.points[i + 1], this.points[i + 2], this.points[i + 3], t));
								const vel = Math.min(maxVel, k / cur);
								const newPoint = this.evaluate(this.points[i], this.points[i + 1], this.points[i + 2], this.points[i + 3], t);
								path.push([t+i, newPoint, vel]);
						}
				}
				path.push([this.points.length - 3, this.points[this.points.length - 2], 0])
				this.injected = path;
				this.speeds(maxAccel);
				return this.injected;
		}
}