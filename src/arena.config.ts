import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { uWebSocketsTransport } from "@colyseus/uwebsockets-transport";

/**
 * Import your Room files
 */
import { CatchTheKitty } from "./rooms/CatchTheKitty";
import {Transport} from "colyseus";

export default Arena({
    getId: () => "CatchTheKitty Server",

    initializeTransport: function() {
        return new uWebSocketsTransport({
        });
    },

    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        gameServer.define('cat', CatchTheKitty);
    },

    initializeExpress: (app) => {
        /**
         * Bind your custom express routes here:
         */
        app.get("/", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });

        /**
         * Bind @colyseus/monitor
         * It is recommended to protect this route with a password.
         * Read more: https://docs.colyseus.io/tools/monitor/
         */
        app.use("/colyseus", monitor());
    },


    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});