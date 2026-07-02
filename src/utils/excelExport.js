import * as XLSX from 'xlsx';

export const exportSessionToExcel = (sessionData) => {
  const { date, players, totalBuyIn, totalCashout, houseProfit } = sessionData;

  // Formato para los jugadores
  const playersData = players.map((p, index) => ({
    'N°': index + 1,
    'Nombre': p.name,
    'Teléfono': p.phone || '-',
    'Inversión Total (S/.)': p.total_buyin || p.balance,
    'Retiro Final (S/.)': p.final_stack !== undefined ? p.final_stack : (p.current_stack || 0),
    'Ganancia / Pérdida (S/.)': p.profit,
    'Estado': p.profit > 0 ? 'Ganó' : p.profit < 0 ? 'Perdió' : 'Empate'
  }));

  // Datos resumen de la sesión
  const summaryData = [
    { 'Resumen': 'Fecha de Sesión', 'Valor': date },
    { 'Resumen': 'Total Jugadores', 'Valor': players.length },
    { 'Resumen': 'Total Dinero en Juego (Caja)', 'Valor': totalBuyIn },
    { 'Resumen': 'Total Dinero Retirado', 'Valor': totalCashout },
    { 'Resumen': 'Diferencia (Casa)', 'Valor': houseProfit }
  ];

  // Crear un nuevo libro de trabajo
  const wb = XLSX.utils.book_new();

  // Crear hojas
  const wsPlayers = XLSX.utils.json_to_sheet(playersData);
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);

  // Ajustar anchos de columna (opcional pero recomendado)
  const wscols = [
    { wch: 5 },  // N°
    { wch: 20 }, // Nombre
    { wch: 15 }, // Teléfono
    { wch: 20 }, // Inversión
    { wch: 20 }, // Retiro
    { wch: 25 }, // Ganancia
    { wch: 10 }  // Estado
  ];
  wsPlayers['!cols'] = wscols;

  const wscolsSummary = [
    { wch: 30 },
    { wch: 20 }
  ];
  wsSummary['!cols'] = wscolsSummary;

  // Añadir hojas al libro
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen de Sesión");
  XLSX.utils.book_append_sheet(wb, wsPlayers, "Detalle Jugadores");

  // Generar el archivo y descargarlo
  const fileName = `Sesion_Poker_${date.replace(/[/:\s]/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
