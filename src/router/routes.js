import { boletosController } from "../controllers/boletosController.js";
import { ciudadesController } from "../controllers/ciudadesController.js";
import { loginController } from "../controllers/loginController.js";
import { registroController } from "../controllers/registroController.js.js";
import { mostrarReservasCliente } from "../controllers/reservaCliente.js";
import { reservasController } from "../controllers/reservasController.js";
import { rutaController } from "../controllers/rutasController.js";
import { superAdminController } from "../controllers/superAdminController.js";
import { ticketsFormController } from "../controllers/ticketFormController.js";
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
      permission: "ciudades.create"
   },tablaCiudades:{
      path: "viajes/ciudades/ciudades-tabla.html",
      controller: ciudadesController,
      private: true,
      permission: "ciudades.index"
   },rutaCiudad:{
      path: "viajes/ciudades/ciudades-ruta.html",
      controller: rutaController,
      private: true,
      permission: "ruta.index"
   },transportes:{
      path: "viajes/transportes/transportes-form.html",
      controller: transportesController,
      private: true,
      permission: "transporte.index"
   },tablaTransportes:{
      path: "viajes/transportes/transportes-tabla.html",
      controller: transportesController,
      private: true,
      permission: "transporte.create"
   },viajes:{
      path: "viajes/vuelos/viajes-form.html",
      controller: viajesController,
      private: true,
      permission: "viajes.create"
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
      permission: "reserva.create"
   },ticketForm:{
      path: "cliente/ticket-form.html",
      controller: ticketsFormController,
      private: true,
      permission: "ticket.index"
   },reservasCliente:{
      path: "cliente/misReservas.html",
      controller: mostrarReservasCliente,
      private: true,
      permission: "reserva.index"
   },boletos:{
      path: "cliente/boletos.html",
      controller: boletosController,
      private: true,
      permission: "ticket.index"
   }

}