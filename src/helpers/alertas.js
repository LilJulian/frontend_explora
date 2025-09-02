import Swal from 'sweetalert2';

export const success = (message) => {
    return Swal.fire({
        title: message,
        icon: "success",
        draggable: true
});
}

export const error = (message) => {
    return Swal.fire({
        title: 'Ups, se presentó un error',
        text: message,
        icon: "error",
        draggable: true
});
}

export const confirm = (message) => {
    return Swal.fire({
        title: "Precaución",
        text: message,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí"
        })
}