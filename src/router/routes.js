import { loginController } from "../controllers/loginController.js";
import { registroController } from "../controllers/registroController.js.js";
import { superAdminController } from "../controllers/superAdminController.js";
import { usuarioController } from "../controllers/usuarioController.js";
import { ticketController } from "../views/viajes/ticket/ticketController";
import { viajesDisponiblesController } from "../views/viajes/viajesDisponibles.js/viajesDisponiblesController";


export const routers = {
   login: {
      path: "auth/login/index.html",
      controller: loginController,
      private: false
   },
   registro:{
      path: "auth/registro/index.html",
      controller: registroController,
      private: false
   },
   viajes:{
      path: "viajes/viajesDisponibles/index.html",
      controller: viajesDisponiblesController,
      private: true
   },
   ticket:{
      path: "viajes/ticket/index.html",
      controller: ticketController,
      private: false
   },
   superadmin:{
      path: "superadmin/menu/index.html",
      controller: superAdminController,
      private: true,
      permission: "superadmin.index"
   },usuarios:{
      path: "superadmin/usuarios/index.html",
      controller: usuarioController,
      private: true,
      permission: "usuarios.index"
   }

}