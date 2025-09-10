import { ciudadesController } from "../controllers/ciudadesController.js";
import { loginController } from "../controllers/loginController.js";
import { registroController } from "../controllers/registroController.js.js";
import { reservasController } from "../controllers/reservasController.js";
import { rutaController } from "../controllers/rutasController.js";
import { superAdminController } from "../controllers/superAdminController.js";
import { transportesController } from "../controllers/transportesController.js";
import { usuarioController } from "../controllers/usuarioController.js";
import { viajesClienteController } from "../controllers/viajesClienteController.js";
import { viajesController } from "../controllers/viajesController.js";
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
   },rutaCiudad:{
      path: "viajes/ciudades/ciudades-ruta.html",
      controller: rutaController,
      private: true,
      permission: "usuarios.index"
   },transportes:{
      path: "viajes/transportes/transportes-form.html",
      controller: transportesController,
      private: true,
      permission: "usuarios.index"
   },tablaTransportes:{
      path: "viajes/transportes/transportes-tabla.html",
      controller: transportesController,
      private: true,
      permission: "usuarios.index"
   },viajes:{
      path: "viajes/vuelos/viajes-form.html",
      controller: viajesController,
      private: true,
      permission: "usuarios.index"
   },tablaViajes:{
      path: "viajes/vuelos/viajes-tabla.html",
      controller: viajesController,
      private: true,
      permission: "viajes.index"
   },cliente:{
      path: "cliente/cliente-index.html",
      controller: viajesClienteController,
      private: true,
      permission: "viajes.index"
   },reserva:{
      path: "cliente/reserva.html",
      controller: reservasController,
      private: true,
      permission: "viajes.index"
   }

}