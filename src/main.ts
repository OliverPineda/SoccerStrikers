import Phaser from 'phaser';
import { feel } from './config';
import { addGoal, crossedGoalLine, resetScore, type Score } from './rules';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = '<div id="hud"><span id="score">0 – 0</span><button id="restart" type="button">Restart</button></div><div id="game"></div>';
const scoreLabel = document.querySelector<HTMLSpanElement>('#score')!;
const restartButton = document.querySelector<HTMLButtonElement>('#restart')!;

class PitchScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Arc;
  private ball!: Phaser.GameObjects.Arc;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private facing = new Phaser.Math.Vector2(1, 0);
  private possessing = false;
  private dribbleAngle = 0;
  private score: Score = resetScore();
  private pausedUntil = 0;
  private lastShotAt = -Infinity;

  constructor() { super('pitch'); }

  create(): void {
    const p = feel.pitch;
    const midY = (p.top + p.bottom) / 2;
    const field = this.add.graphics();
    field.fillStyle(0x276b48).fillRect(p.left, p.top, p.right - p.left, p.bottom - p.top);
    field.lineStyle(3, 0xd5e8d2).strokeRect(p.left, p.top, p.right - p.left, p.bottom - p.top);
    field.lineBetween((p.left + p.right) / 2, p.top, (p.left + p.right) / 2, p.bottom);
    field.strokeCircle((p.left + p.right) / 2, midY, 65);
    field.fillStyle(0xd5e8d2).fillCircle((p.left + p.right) / 2, midY, 3);
    for (const x of [p.left - p.goalDepth, p.right]) {
      field.fillStyle(0x1b4939, 0.85).fillRect(x, midY - p.goalHalfHeight, p.goalDepth, p.goalHalfHeight * 2);
      field.lineStyle(3, 0xf4f4ed).strokeRect(x, midY - p.goalHalfHeight, p.goalDepth, p.goalHalfHeight * 2);
    }
    // Repaint the goal-line openings so the opening is visible above the net.
    field.lineStyle(5, 0x276b48);
    field.lineBetween(p.left, midY - p.goalHalfHeight + 2, p.left, midY + p.goalHalfHeight - 2);
    field.lineBetween(p.right, midY - p.goalHalfHeight + 2, p.right, midY + p.goalHalfHeight - 2);

    this.player = this.add.circle(310, midY, feel.playerRadius, 0xffcf4d);
    this.ball = this.add.circle((p.left + p.right) / 2, midY, feel.ballRadius, 0xffffff);
    this.physics.add.existing(this.player);
    this.physics.add.existing(this.ball);
    this.playerBody.setCircle(feel.playerRadius);
    this.ballBody.setCircle(feel.ballRadius);
    this.playerBody.setMaxVelocity(feel.playerMaxSpeed);
    this.playerBody.setDrag(feel.playerFriction);
    this.ballBody.setDrag(feel.ballFriction);
    this.ballBody.setBounce(feel.ballBounce);
    this.playerBody.setBounce(feel.playerBallBounce);
    this.physics.add.collider(this.player, this.ball, undefined, () =>
      !this.possessing && this.time.now - this.lastShotAt >= feel.shotCooldownMs,
    );

    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.shoot(pointer.worldX, pointer.worldY));
    restartButton.addEventListener('click', () => this.restart());
    this.updateScore();
  }

  private get playerBody(): Phaser.Physics.Arcade.Body { return this.player.body as Phaser.Physics.Arcade.Body; }
  private get ballBody(): Phaser.Physics.Arcade.Body { return this.ball.body as Phaser.Physics.Arcade.Body; }

  update(time: number, delta: number): void {
    if (time < this.pausedUntil) return;
    const x = Number(this.keys.D.isDown || this.keys.RIGHT.isDown) - Number(this.keys.A.isDown || this.keys.LEFT.isDown);
    const y = Number(this.keys.S.isDown || this.keys.DOWN.isDown) - Number(this.keys.W.isDown || this.keys.UP.isDown);
    const direction = new Phaser.Math.Vector2(x, y).normalize();
    this.playerBody.setAcceleration(direction.x * feel.playerAcceleration, direction.y * feel.playerAcceleration);
    if (direction.lengthSq() > 0) this.facing.copy(direction);
    this.constrainPlayer();

    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.ball.x, this.ball.y);
    if (!this.possessing && time - this.lastShotAt >= feel.shotCooldownMs &&
      distance <= feel.possessionDistance && this.ballBody.speed < feel.possessionCaptureMaxSpeed) {
      this.possessing = true;
      this.dribbleAngle = distance > 0 ? Phaser.Math.Angle.Between(this.player.x, this.player.y, this.ball.x, this.ball.y) : this.facing.angle();
    }
    if (this.possessing) {
      const previousAngle = this.dribbleAngle;
      const maxTurn = Phaser.Math.DegToRad(feel.dribbleTurnRateDegrees) * Math.min(delta, 50) / 1000;
      const turn = Phaser.Math.Clamp(Phaser.Math.Angle.Wrap(this.facing.angle() - previousAngle), -maxTurn, maxTurn);
      this.dribbleAngle = Phaser.Math.Angle.Wrap(previousAngle + turn);
      const offsetX = Math.cos(this.dribbleAngle) * feel.dribbleTargetDistance;
      const offsetY = Math.sin(this.dribbleAngle) * feel.dribbleTargetDistance;
      const targetX = this.player.x + offsetX;
      const targetY = this.player.y + offsetY;
      const seconds = Math.max(delta, 1) / 1000;
      const orbitalX = (Math.cos(this.dribbleAngle) - Math.cos(previousAngle)) * feel.dribbleTargetDistance / seconds;
      const orbitalY = (Math.sin(this.dribbleAngle) - Math.sin(previousAngle)) * feel.dribbleTargetDistance / seconds;
      this.ballBody.setVelocity(
        this.playerBody.velocity.x + orbitalX + (targetX - this.ball.x) * feel.dribbleFollowGain,
        this.playerBody.velocity.y + orbitalY + (targetY - this.ball.y) * feel.dribbleFollowGain,
      );
      this.ballBody.setDrag(0);
      this.ballBody.setAcceleration(0);
      this.ballBody.setMaxVelocity(feel.dribbleMaxSpeed);
    } else {
      this.ballBody.setDrag(feel.ballFriction);
      this.ballBody.setAcceleration(0);
      this.ballBody.setMaxVelocity(feel.kickPowerMax);
    }
    this.constrainBall();
    const goal = crossedGoalLine(this.ball, feel.ballRadius, feel.pitch);
    if (goal) this.goal(goal, time);
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.shoot();
  }

  private shoot(targetX?: number, targetY?: number): void {
    const now = this.time.now;
    if (now < this.pausedUntil || now - this.lastShotAt < feel.shotCooldownMs) return;
    if (!this.possessing) return;
    const aim = targetX === undefined ? this.facing.clone() : new Phaser.Math.Vector2(targetX - this.ball.x, targetY! - this.ball.y).normalize();
    if (aim.lengthSq() === 0) aim.copy(this.facing);
    const angle = Phaser.Math.Angle.Wrap(aim.angle() - this.facing.angle());
    const cone = Phaser.Math.DegToRad(feel.kickConeDegrees) / 2;
    aim.setAngle(this.facing.angle() + Phaser.Math.Clamp(angle, -cone, cone) + Phaser.Math.DegToRad(feel.kickAngleDegrees));
    const p = feel.pitch;
    // A wall-side kick is redirected along the pitch so it cannot be trapped in the rail.
    if (this.ball.x <= p.left + feel.ballRadius + 2 && aim.x < 0) aim.x = Math.abs(aim.x);
    if (this.ball.x >= p.right - feel.ballRadius - 2 && aim.x > 0) aim.x = -aim.x;
    if (this.ball.y <= p.top + feel.ballRadius + 2 && aim.y < 0) aim.y = Math.abs(aim.y);
    if (this.ball.y >= p.bottom - feel.ballRadius - 2 && aim.y > 0) aim.y = -aim.y;
    aim.normalize();
    const power = Phaser.Math.Linear(feel.kickPowerMin, feel.kickPowerMax, Math.min(1, this.playerBody.speed / feel.playerMaxSpeed));
    this.ballBody.setAcceleration(0);
    this.ballBody.setMaxVelocity(feel.kickPowerMax);
    this.ballBody.setVelocity(aim.x * power, aim.y * power);
    this.possessing = false;
    this.lastShotAt = now;
  }

  private constrainPlayer(): void {
    const b = this.playerBody, p = feel.pitch, r = feel.playerRadius;
    if (this.player.x < p.left + r) { this.player.x = p.left + r; b.position.x = p.left; b.setVelocityX(Math.max(0, b.velocity.x)); }
    if (this.player.x > p.right - r) { this.player.x = p.right - r; b.position.x = p.right - 2 * r; b.setVelocityX(Math.min(0, b.velocity.x)); }
    if (this.player.y < p.top + r) { this.player.y = p.top + r; b.position.y = p.top; b.setVelocityY(Math.max(0, b.velocity.y)); }
    if (this.player.y > p.bottom - r) { this.player.y = p.bottom - r; b.position.y = p.bottom - 2 * r; b.setVelocityY(Math.min(0, b.velocity.y)); }
  }

  private constrainBall(): void {
    const b = this.ballBody, p = feel.pitch, r = feel.ballRadius;
    const midY = (p.top + p.bottom) / 2;
    const inMouth = Math.abs(this.ball.y - midY) + r <= p.goalHalfHeight;
    if (this.ball.y < p.top + r) { this.ball.y = p.top + r; b.position.y = p.top; b.setVelocityY(Math.abs(b.velocity.y) * feel.ballBounce); }
    if (this.ball.y > p.bottom - r) { this.ball.y = p.bottom - r; b.position.y = p.bottom - 2 * r; b.setVelocityY(-Math.abs(b.velocity.y) * feel.ballBounce); }
    if (!inMouth) {
      if (this.ball.x < p.left + r) { this.ball.x = p.left + r; b.position.x = p.left; b.setVelocityX(Math.abs(b.velocity.x) * feel.ballBounce); }
      if (this.ball.x > p.right - r) { this.ball.x = p.right - r; b.position.x = p.right - 2 * r; b.setVelocityX(-Math.abs(b.velocity.x) * feel.ballBounce); }
    }
    // A ball shoved beyond a rail is returned to its nearest playable point.
    if (this.ball.x < p.left - p.goalDepth && !inMouth) { this.ball.x = p.left + r; b.position.x = p.left; }
    if (this.ball.x > p.right + p.goalDepth && !inMouth) { this.ball.x = p.right - r; b.position.x = p.right - 2 * r; }
  }

  private goal(side: 'left' | 'right', time: number): void {
    this.score = addGoal(this.score, side);
    this.updateScore();
    this.playerBody.setAcceleration(0).setVelocity(0);
    this.resetBall();
    this.pausedUntil = time + feel.resetPauseMs;
  }

  private resetBall(): void {
    const p = feel.pitch;
    this.possessing = false;
    this.ballBody.setDrag(feel.ballFriction);
    this.ballBody.setAcceleration(0).setVelocity(0);
    this.ballBody.reset((p.left + p.right) / 2, (p.top + p.bottom) / 2);
  }

  private restart(): void {
    this.score = resetScore();
    this.updateScore();
    this.resetBall();
    this.playerBody.setAcceleration(0).setVelocity(0);
    this.playerBody.reset(310, (feel.pitch.top + feel.pitch.bottom) / 2);
    this.facing.set(1, 0);
    this.pausedUntil = this.time.now + feel.resetPauseMs;
    this.lastShotAt = this.time.now;
  }

  private updateScore(): void { scoreLabel.textContent = `${this.score.left} – ${this.score.right}`; }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: feel.width,
  height: feel.height,
  parent: 'game',
  backgroundColor: '#143d2d',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: PitchScene,
});
