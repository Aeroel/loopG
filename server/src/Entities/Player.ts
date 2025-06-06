import { Collision_Stuff } from "#root/Collision_Stuff.js";
import { Base_Entity } from "#root/Entities/Base_Entity.js";
import { Entity_Forces, type Force_Name as Force_Name } from "#root/Entities/Entity_Forces.js";
import { SocketStorage } from "#root/SocketStorage.js";
import type { Direction, Orientation, Position } from "#root/Type_Stuff.js";
import { World } from "#root/World.js";
import { log } from "console";
import type { Socket } from "socket.io";
export { Player };
class Player extends Base_Entity {
  controls = {
    right: false,
    left: false,
    up: false,
    down: false,
  };
  standardMovementSpeed = 0.12;
  socketId: Socket["id"] = "none";
  constructor() {
    super();
    this.addTag("Player");
    this.addTag("Can_Ride_Train");
  }
  setVisionRange(visionRange: number) {
    this.visionRange = visionRange;
  }
  setSocketId(id: Socket["id"]) {
    this.socketId = id;
  }
  getSocket() {
    return SocketStorage.find(socket => socket.id === this.socketId);
  }
  updateState() {
    if (this.controls.right) {
      this.forces.set("Player_Controls", "right", this.standardMovementSpeed);
    }
    if (this.controls.left) {
      this.forces.set("Player_Controls", "left", this.standardMovementSpeed);
    }
    if (this.controls.up) {
      this.forces.set("Player_Controls", "up", this.standardMovementSpeed);
    }
    if (this.controls.down) {
      this.forces.set("Player_Controls", "down", this.standardMovementSpeed);
    }
    this.Collision_Manager();
    super.updateState();
  }
  Collision_Manager() {
    const player = this;
    const collisionDirs = {right:false, left: false, up: false, down: false};
    World.getCurrentEntities().forEach((entity: Base_Entity) => {
      if (player === entity) {
        return;
      }
      const Can_Collide = (entity.hasTag("Wall") || entity.hasTag("Sliding_Door"));
      if (!Can_Collide) {
        return;
      }
      const wall_or_door = entity;

      const Answer = Collision_Stuff.Did_A_Collision_Occur_And_What_Is_The_Position_Just_Before_Collision(player, wall_or_door);
      if (Answer.Collision_Occurred === false) {
        return;
      }
      
      const playerSide = Collision_Stuff.Which_Side_Of_Entity_Is_Facing_Another_Entity(player, wall_or_door);
      const playerCollisionDirection = { "right": "right", "left": "left", "bottom": "down", "top": "up" }[playerSide] as Direction;
      collisionDirs[playerCollisionDirection] = true;
      const neededKeys = player.forces.Get_Keys_Of_Force_Components_Of_A_Force_That_Are_Not_Present_In_Another_Entity_Forces(playerCollisionDirection, wall_or_door.forces);

      player.forces.set(
        `Pushback_${Math.random()}`,
        player.forces.Get_Opposite_Force_Name(playerCollisionDirection),
        player.standardMovementSpeed);

      neededKeys.forEach(key => {
        const value = player.forces.Get_By_Key(key, playerCollisionDirection);
        player.forces.set(key, playerCollisionDirection, 0);
        player.forces.set(key, player.forces.Get_Opposite_Force_Name(playerCollisionDirection), value);
      })

      return;

    })
  }
}