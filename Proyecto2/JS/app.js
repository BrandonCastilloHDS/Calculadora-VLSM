document.addEventListener("DOMContentLoaded", () => {
  const botonCalcular = document.getElementById("calcular");
  const dirIP = document.getElementById("DireccionIP");
  const numBits = document.getElementById("Mascara");
  const inputRedes = document.getElementById("NumRedes");
  const resultadosCalculo = document.getElementById("resultadosCalculo");

  botonCalcular.addEventListener("click", (e) => {
    e.preventDefault();

    const totalRedes = parseInt(inputRedes.value);
    const bitsMascara = parseInt(numBits.value);
    const ipBase = dirIP.value.trim();
    const dirIPValida = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

    if (!dirIPValida.test(ipBase)) {
      alert("Por favor, ingresa una dirección IP válida.");
      return;
    }

    if (isNaN(bitsMascara) || bitsMascara < 0 || bitsMascara > 32) {
      alert("Por favor, ingresa un número válido de bits para la máscara.");
      return;
    }

    if (isNaN(totalRedes) || totalRedes <= 0) {
      alert("Por favor, ingresa un número válido de redes.");
      return;
    }

    // Obtener los valores de hosts desde la tabla generada
    const inputsHosts = document.querySelectorAll("input[id^='NumHost-']");
    if (inputsHosts.length !== totalRedes) {
      alert("Genera la tabla para la cantidad correcta de redes antes de calcular.");
      return;
    }

    const hostsPorRed = [];
    for (let i = 0; i < inputsHosts.length; i++) {
      const valHost = parseInt(inputsHosts[i].value);
      if (isNaN(valHost) || valHost <= 0) {
        alert(`Por favor, ingresa un número válido de hosts para la red #${i + 1}.`);
        return;
      }
      hostsPorRed.push(valHost);
    }

    calcularSubneteo(ipBase, bitsMascara, hostsPorRed);
  });

  function calcularSubneteo(ipBase, mascaraBitsOriginal, hostsPorRed) {
    resultadosCalculo.innerHTML = ""; // limpiar tabla de resultados

    let baseIp = ipBase.split('.').map(Number);
    let offset = 0;

    for (let i = 0; i < hostsPorRed.length; i++) {
      const cantidadHost = hostsPorRed[i];
      const N = Math.ceil(Math.log2(cantidadHost + 2));
      const bitsNuevaMask = 32 - N;
      const resultadoMask = calcularMask(bitsNuevaMask);
      const saltoSubred = Math.pow(2, N);

      let nuevaIp = baseIp.slice();
      const indiceOcteto = posicionOcteto(resultadoMask);

      nuevaIp[3 - indiceOcteto] += offset;

      for (let j = 3; j > 0; j--) {
        if (nuevaIp[j] > 255) {
          nuevaIp[j] -= 256;
          nuevaIp[j - 1] += 1;
        }
      }

      const hostsValidos = saltoSubred - 2;

      resultadosCalculo.innerHTML += `
        <tr>
          <th scope="row">${i + 1}</th>
          <td>${nuevaIp.join(".")}</td>
          <td>${bitsNuevaMask}</td>
          <td>${resultadoMask.join(".")}</td>
          <td>${hostsValidos}</td>
        </tr>
      `;

      offset += saltoSubred;
    }
  }

  function calcularMask(bits) {
    let mask = {
      primerOcteto: [0,0,0,0,0,0,0,0],
      segundoOcteto: [0,0,0,0,0,0,0,0],
      tercerOcteto: [0,0,0,0,0,0,0,0],
      cuartoOcteto: [0,0,0,0,0,0,0,0]
    };

    for (let i = 0; i < 32; i++) {
      let bitIndex = i % 8;
      let bloque = Math.floor(i / 8);

      if(i < bits) {
        switch(bloque){
          case 0: mask.primerOcteto[bitIndex] = 1; break;
          case 1: mask.segundoOcteto[bitIndex] = 1; break;
          case 2: mask.tercerOcteto[bitIndex] = 1; break;
          case 3: mask.cuartoOcteto[bitIndex] = 1; break;
        }
      }
    }
    return mascaraDecimal(mask);
  }

  function mascaraDecimal(mascara){
    return [
      parseInt(mascara.primerOcteto.join(""), 2),
      parseInt(mascara.segundoOcteto.join(""), 2),
      parseInt(mascara.tercerOcteto.join(""), 2),
      parseInt(mascara.cuartoOcteto.join(""), 2)
    ];
  }

  function posicionOcteto(octeto) {
    let indice = [...octeto].reverse();
    for (let i = 0; i < indice.length; i++) {
      if (indice[i] !== 0) return i;
    }
    return 0;
  }
});
