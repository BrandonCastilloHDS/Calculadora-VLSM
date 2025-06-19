document.addEventListener("DOMContentLoaded", () => {
  const btnGenerar = document.getElementById("generarTabla");
  const inputRedes = document.getElementById("NumRedes");
  const cuerpoTabla = document.getElementById("cuerpoTabla");

  btnGenerar.addEventListener("click", (e) => {
    e.preventDefault();
    const totalRedes = parseInt(inputRedes.value);

    if (isNaN(totalRedes) || totalRedes <= 0) {
      alert("Por favor, ingresa un número válido de redes.");
      return;
    }

    cuerpoTabla.innerHTML = "";

    for (let i = 1; i <= totalRedes; i++) {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${i}</td>
        <td>
          <input type="number" class="form-control numHost" id="NumHost-${i}" placeholder="Cantidad de hosts" min="1" />
        </td>
      `;
      cuerpoTabla.appendChild(fila);
    }
  });
});
