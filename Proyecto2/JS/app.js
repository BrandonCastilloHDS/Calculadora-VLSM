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

    if (isNaN(bitsMascara) || bitsMascara <= 0 || bitsMascara > 32) {
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

    // Construir array con índice original y hosts
    const hostsPorRed = [];
    for (let i = 0; i < inputsHosts.length; i++) {
      const valHost = parseInt(inputsHosts[i].value);
      if (isNaN(valHost) || valHost <= 0) {
        alert(`Por favor, ingresa un número válido de hosts para la red #${i + 1}.`);
        return;
      }
      hostsPorRed.push({ index: i, hosts: valHost });
    }

    // Ordenamos de mayor a menor por hosts para subnetear bien
    hostsPorRed.sort((a, b) => b.hosts - a.hosts);

    calcularSubneteo(ipBase, bitsMascara, hostsPorRed);
  });

function calcularSubneteo(ipBase, mascaraBitsOriginal, hostsPorRed) {
  resultadosCalculo.innerHTML = ""; // limpiar tabla

  let baseIp = ipBase.split('.').map(Number);
  let offset = 0;
  const resultados = [];

  for (const item of hostsPorRed) {
    const cantidadHost = item.hosts;
    const N = Math.ceil(Math.log2(cantidadHost + 2));
    const bitsNuevaMask = 32 - N;
    const resultadoMask = calcularMask(bitsNuevaMask);
    
    // Aquí usamos tu función para calcular salto
    const saltoSubred = saltosSubred(resultadoMask);

    let nuevaIp = baseIp.slice();
    const indiceOcteto = posicionOcteto(resultadoMask);

    nuevaIp[3 - indiceOcteto] += offset;

    // Ajustar cuando hay overflow en octetos
    for (let j = 3; j > 0; j--) {
      if (nuevaIp[j] > 255) {
        nuevaIp[j] -= 256;
        nuevaIp[j - 1] += 1;
      }
    }

    const hostsValidos = Math.pow(2, N) - 2;

    // Calcular primera IP válida (IP red + 1)
    const primeraIpValida = nuevaIp.slice();
    primeraIpValida[3] += 1;
    // Ajustar overflow si fuera necesario (raro que pase aquí, pero por seguridad)
    for (let j = 3; j > 0; j--) {
      if (primeraIpValida[j] > 255) {
        primeraIpValida[j] -= 256;
        primeraIpValida[j - 1] += 1;
      }
    }

    // Calcular última IP válida (broadcast - 1)
    const ultimaIpValida = nuevaIp.slice();
    let broadcastIp = nuevaIp.slice();
    broadcastIp[3 - indiceOcteto] += saltoSubred - 1;
    // Ajustar overflow broadcast
    for (let j = 3; j > 0; j--) {
      while (broadcastIp[j] > 255) {
        broadcastIp[j] -= 256;
        broadcastIp[j - 1] += 1;
      }
    }
    // Última IP válida es broadcast - 1
    ultimaIpValida[3 - indiceOcteto] = broadcastIp[3 - indiceOcteto];
    for(let k = 3; k > 0; k--){
      ultimaIpValida[k] = broadcastIp[k];
    }
    // Restar 1 a la última IP válida
    ultimaIpValida[3] -= 1;
    for (let j = 3; j > 0; j--) {
      if (ultimaIpValida[j] < 0) {
        ultimaIpValida[j] += 256;
        ultimaIpValida[j - 1] -= 1;
      }
    }

    resultados.push({
      index: item.index,
      ip: nuevaIp.join("."),
      bitsMask: bitsNuevaMask,
      mask: resultadoMask.join("."),
      hostsValidos: hostsValidos,
      primeraIp: primeraIpValida.join("."),
      ultimaIp: ultimaIpValida.join(".")
    });

    offset += saltoSubred;
  }

  // Mostrar resultados, ahora con primera y última IP válida
  for (const res of resultados) {
    resultadosCalculo.innerHTML += `
      <tr>
        <th scope="row">${res.index + 1}</th>
        <td>${res.ip}</td>
        <td>${res.bitsMask}</td>
        <td>${res.mask}</td>
        <td>${res.hostsValidos}</td>
        <td>${res.primeraIp}</td>
        <td>${res.ultimaIp}</td>
      </tr>
    `;
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

  function saltosSubred(mascaraDecimal) {
    const octetos = [...mascaraDecimal].reverse();
    for (let i = 0; i < octetos.length; i++) {
      if (octetos[i] !== 0) {
        return 256 - octetos[i];
      }
    }
    return 0;
  }
});
