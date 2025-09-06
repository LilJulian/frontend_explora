import { ciudadesController } from "../controllers/ciudadesController.js";
import { loginController } from "../controllers/loginController.js";
import { registroController } from "../controllers/registroController.js.js";
import { superAdminController } from "../controllers/superAdminController.js";
import { usuarioController } from "../controllers/usuarioController.js";
import { ticketController } from "../views/viajes/ticket/ticketController";


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
      path: "superadmin/usuarios/usuarios-form.html",
      controller: usuarioController,
      private: true,
      permission: "usuarios.create"
   },tablaUsuarios:{
      path: "superadmin/usuarios/usuarios-tabla.html",
      controller: usuarioController,
      private: true,
      permission: "usuarios.index"
   },ciudades:{
      path: "viajes/ciudades/ciudades-form.html",
      controller: ciudadesController,
      private: true,
      permission: "usuarios.index"
   },tablaCiudades:{
      path: "viajes/ciudades/ciudades-tabla.html",
      controller: ciudadesController,
      private: true,
      permission: "usuarios.index"
   }

}