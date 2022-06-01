import { Room, Delayed, Client } from 'colyseus';
import { type, Schema, MapSchema, ArraySchema } from '@colyseus/schema';

const TURN_TIMEOUT = 10
const BOARD_WIDTH = 19;
const BOARD_HEIGHT = 19;

class State extends Schema {
  @type("string") currentTurn: string;
  @type({ map: "boolean" }) players = new MapSchema<boolean>();
  @type(["number"]) board: number[] = new ArraySchema<number>
  (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  @type("string") winner: string;
  @type("boolean") draw: boolean;
}

export class CatchTheKitty extends Room<State> {
  maxClients = 2;
  catx = (BOARD_WIDTH-1)/2;
  caty = (BOARD_HEIGHT-1)/2;

  onCreate () {
    this.setState(new State());
    this.setSeatReservationTime(100000);
    this.onMessage("action", (client, message) => this.playerAction(client, message));
    console.log("Room Created!");
    this.resetAutoDisposeTimeout(100000);
  }

  onJoin (client: Client) {
    this.setSeatReservationTime(100000);
    this.state.players.set(client.sessionId, true);
    console.log(this.state.players.size + " players joined!");
    if (this.state.players.size === this.maxClients) {
      this.state.currentTurn = client.sessionId;

      // lock this room for new users
      this.lock();
    }
  }

  playerAction (client: Client, data: any) {
    if (this.state.winner || this.state.draw) {
      return false;
    }

    if (client.sessionId === this.state.currentTurn) {
      const playerIds = Array.from(this.state.players.keys());

      const index = data.index;
      const x = index % BOARD_WIDTH;
      const y = BOARD_HEIGHT - Math.floor(index / BOARD_WIDTH) - 1;

      if (this.state.board[index] <=2) {
        if (client.sessionId === playerIds[0])
        {
          if (Math.abs(this.catx-x)+Math.abs(this.caty-y)==1)
          {
            this.catx = x;
            this.caty = y;
            this.state.board[index] = this.state.board[index]==1?2:1;
            if (this.checkWin(x, y, 0))
            {
              this.state.winner = client.sessionId;
              console.log("winner: " + client.sessionId);
            }
            else
            {
              this.state.currentTurn = playerIds[1];
            }
          }
        }
        else if (x!=this.catx || y!=this.caty)
        {
          this.state.board[index] = 3;
          if (this.checkLose(x, y, 1))
          {
            this.state.winner = client.sessionId;
            console.log("winner: " + client.sessionId);
          }
          else
          {
            this.state.currentTurn = playerIds[0];
          }
        }

      }
    }
  }

//  ...
// (0,2) (1,2) (2,2)
// (0,1) (1,1) (2,1)
// (0,0) (1,0) (2,0) ...
//
// value: empty=0 passed=1,2 block=3
//
  checkBoardComplete () {
    return this.state.board
        .filter(item => item === 0)
        .length === 0;
  }

  checkWin (x: any, y: any, move: any) {
    let board = this.state.board;
    return (x==0 || y==0 || x==BOARD_WIDTH-1 || y==BOARD_HEIGHT-1);
  }

  checkLose (x: any, y: any, move: any) {
    let board = this.state.board;
    return this.surrounded(x,y)==4;
  }

  surrounded(x:number, y:number):number
  {
    let board = this.state.board;
    let index = (BOARD_HEIGHT - y -1) * BOARD_WIDTH + x;
    if (this.checkWin(x,y,0))
      return 0;
    if (board[index]==3)
      return 1;
    let prev = board[index];
    let danger = 0;
    board[index] = 3;
      danger = this.surrounded(x-1,y)+this.surrounded(x,y-1)+this.surrounded(x+1,y)+this.surrounded(x,y+1)
    board[index] = prev;
    return danger;
  }

  onLeave (client: Client) {
    this.state.players.delete(client.sessionId);

    let remainingPlayerIds = Array.from(this.state.players.keys());
    if (remainingPlayerIds.length > 0) {
      this.state.winner = remainingPlayerIds[0]
    }
  }

}

