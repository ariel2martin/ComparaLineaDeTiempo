//Inicio y fin en formato texo,   d/M/yyyy HH:mm:ss  osea 24hs sin am/pm FORMAT(F.Inicio, 'd/M/yyyy HH:mm:ss') Inicio,
// o formato 'yyyy-mm-dd hh:mm:ss'  CONVERT( VARCHAR, fecha ,120 )

//si está la etiqueta se va a ver en el tooltip
// hay dos casos especiales de etiqueta: "inicio Gdia" y "fin Gdia" que va a dibujar semicirculos

"use strict";
import * as d3 from "d3";
//import timeline from "../assets/d3-timeline.js";
const { timeline } = require("../assets/AcuTimeline.js");

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import DataViewCategorical = powerbi.DataViewCategorical;
import DataView = powerbi.DataView;
import PrimitiveValue = powerbi.PrimitiveValue;
import { VisualFormattingSettingsModel } from "./settings";

export class Visual implements IVisual {
  private target: HTMLElement;
  private formattingSettings: VisualFormattingSettingsModel;
  private formattingSettingsService: FormattingSettingsService;

  constructor(options: VisualConstructorOptions) {
    //    console.log("constructor");
    this.target = options.element;
    this.formattingSettingsService = new FormattingSettingsService();
    this.formattingSettings = new VisualFormattingSettingsModel();
  }

  public update(options: VisualUpdateOptions): void {
    // en esta version solo tomará maximo 48hs, para que no colapse
    // ya no lo usamos, ahora automaticmente el eje pasa a dias const CantHorasMaximasEnLineaDeTiempo = 48; // el eje X 
    const CantMaxEquiposAComparar = 25; //el eje Y
    const CantMaxregistros = 1000;  //no pude aumentar esto en capabilities.json
    const MensajeExceso =
      "Maximo alcanzado, se muestran hasta " +
      CantMaxEquiposAComparar +
      " lineas, " +
      //CantHorasMaximasEnLineaDeTiempo +
      //" Horas y " +
      CantMaxregistros +
      " registros";

    // Dimensiones del contenedor
    const width = options.viewport.width;
    const height = options.viewport.height;

    // Limpia cualquier contenido anterior
    d3.select(this.target).selectAll("*").remove();
    const tooltip = createTooltip(d3.select(this.target));
    interface TimeEntry {
      color: string;
      label: string;
      EtiquetaTooltip: string;
      starting_time: number;
      ending_time?: number;
      display?: string;
    }

    interface grupoData {
      label: string;
      times: TimeEntry[];
    }
    function transformData(dataView: DataView): grupoData[] {
      //el codigo para ver si hay etiqueta y si hay color, está bien. Pero se podria optimizar
      if (!dataView || !dataView.categorical) return [];
      const hayonohay = dataView?.categorical?.categories || [];
      let equipoCategoria = hayonohay?.find(c => c.source.roles["equipo"]);
      let inicioCategoria = hayonohay?.find(c => c.source.roles["inicio"]);
      let finCategoria = hayonohay?.find(c => c.source.roles["fin"]);
      let hasGrupo = equipoCategoria && equipoCategoria.values.length > 0;
      let hasInicio = inicioCategoria && inicioCategoria.values.length > 0;
      let hasFin = finCategoria && finCategoria.values.length > 0;
      
      if (!hasGrupo || !hasInicio || !hasFin) { d3.select(this.target).selectAll("*").remove(); return []; }


      const hasEtiqueta = hayonohay.some(
        (category) => category.source.roles?.etiqueta
      );
      const hasEtiquetaDonde = hayonohay.findIndex(
        (category) => category.source.roles?.etiqueta
      );

   
      const hasColor = hayonohay.some(
        (category) => category.source.roles?.color
      );
      const hasColorDonde = hayonohay.findIndex(
        (category) => category.source.roles?.color
      );

      const grupos = dataView.categorical.categories?.[0]
        .values as PrimitiveValue[];
      const colores = hasColor
        ? (dataView.categorical.categories[hasColorDonde]?.values as
            | PrimitiveValue[]
            | undefined)
        : undefined;
      const etiquetas = hasEtiqueta
        ? (dataView.categorical.categories[hasEtiquetaDonde]?.values as
            | PrimitiveValue[]
            | undefined)
        : undefined;
      const inicios = dataView.categorical.categories?.[1]
        .values as PrimitiveValue[];
      const fines = dataView.categorical.categories?.[2]
        .values as PrimitiveValue[];
      //no uso const details = dataView.categorical.values?.[0].values as PrimitiveValue[];
      
      const grupoMap: { [key: string]: TimeEntry[] } = {};
      if (grupos.length >= CantMaxregistros) {
        console.log("exceso en registros ", grupos.length);
        const grupo = MensajeExceso;

        if (!grupoMap[grupo]) {
          grupoMap[grupo] = [];
        }
      } else {
        
        let FechaInicialGrafico = formatoFechaHora("1/1/2030 11:22:33");
        //console.log(FechaInicialGrafico)
        for (let i = 0; i < inicios.length; i++) {
          if (formatoFechaHora(inicios[i]) < FechaInicialGrafico) {
            FechaInicialGrafico = formatoFechaHora(inicios[i]);
          }
        }
        /* verifica
        console.log(FechaInicialGrafico)
        const starting_time = new Date(FechaInicialGrafico);
        const aux2 = `${starting_time.getDate()}/${starting_time.getMonth() + 1}/${starting_time.getFullYear()} ${starting_time.getHours()}:${starting_time.getMinutes()}`;
        console.log(aux2)
        */

        for (let i = 0; i < grupos.length; i++) {
          let grupo = grupos[i] as string; // Nombre del equipo
          const color: string = colores?.[i] ? String(colores[i]) : "blue";
          const etiqueta: string = etiquetas?.[i] ? String(etiquetas[i]) : "";
          const inicio = inicios[i] as string;
          const fin = fines[i] as string;

          if (!grupo) continue; //obligatorio
          /*
          if (
            formatoFechaHora(fin) >
            FechaInicialGrafico +
              CantHorasMaximasEnLineaDeTiempo * 60 * 60 * 1000
          ) {
            grupo = MensajeExceso;
            grupoMap[grupo] = [];
            continue; //maximo 48Hs en el grafico
          }
            */
          
          if (Object.keys(grupoMap).length == CantMaxEquiposAComparar) {
            grupo = MensajeExceso;
          }
          if (Object.keys(grupoMap).length > CantMaxEquiposAComparar) continue;
          if (!grupoMap[grupo]) {
            grupoMap[grupo] = [];
          }

          if (etiquetas?.[i] == "Fin Gdia") {
            const timeEntry: TimeEntry = {
              color: color || "blue",
              label: "",
              EtiquetaTooltip: etiqueta || "",
              starting_time: formatoFechaHora(inicio) || 0,
              ending_time: formatoFechaHora(fin) || 0,
              display: "fin",
            };
            grupoMap[grupo].push(timeEntry);
          } else {
            if (etiquetas?.[i] == "inicio Gdia") {
              const timeEntry: TimeEntry = {
                color: color || "blue",
                label: "",
                EtiquetaTooltip: etiqueta || "",
                starting_time: formatoFechaHora(inicio) || 0,
                ending_time: formatoFechaHora(fin) || 0,
                display: "inicio",
              };
              grupoMap[grupo].push(timeEntry);
            } else {
              if (inicio >= fin) {
                const timeEntry: TimeEntry = {
                  color: "red",
                  label: "",
                  EtiquetaTooltip: etiqueta || "",
                  starting_time: formatoFechaHora(inicio) || 0,
                  ending_time: formatoFechaHora(inicio) || 0,
                  display: "circle",
                };
                //console.log(etiquetas?.[i], timeEntry)
                grupoMap[grupo].push(timeEntry);
              } else {
                const timeEntry: TimeEntry = {
                  color: color || "blue",
                  label: "",
                  EtiquetaTooltip: etiqueta || "",
                  starting_time: formatoFechaHora(inicio) || 0,
                  ending_time: formatoFechaHora(fin) || 0,
                };
                grupoMap[grupo].push(timeEntry);
              }
            }
          }
        }
      }
      return Object.keys(grupoMap).map((grupo) => ({
        label: grupo,
        times: grupoMap[grupo],
      }));
    }
    

    const testData2 = transformData(options.dataViews[0]);

    var chart = timeline()
      .stack()
      .margin({ left: 220, right: 40, top: 0, bottom: 0 })
            
      .hover(function (d, i, datum, event) {
        // d is the current rendering object
        // i is the index during d3 rendering
        // datum is the id object
        //console.log(d, i, datum)
        const cx = d.srcElement.getAttribute("cx");
        const xPosition = cx ? parseFloat(cx) : null;
        const cy = d.srcElement.getAttribute("cy");
        const yPosition = cy ? parseFloat(cy) : null;

        const starting_time = new Date(d.srcElement.__data__.starting_time);
        const inicio = `${starting_time.getDate()}/${
          starting_time.getMonth() + 1
        }/${starting_time.getFullYear()} ${starting_time.getHours()}:${starting_time.getMinutes()}`;
        const ending_time = new Date(d.srcElement.__data__.ending_time);
        const fin = d.srcElement.__data__.ending_time
          ? `${ending_time.getDate()}/${
              ending_time.getMonth() + 1
            }/${ending_time.getFullYear()} ${ending_time.getHours()}:${ending_time.getMinutes()}`
          : "";
        /*
        tooltip.show(
          ` ${d.srcElement.__data__.EtiquetaTooltip}<br><strong></strong> ${inicio}<br><strong>Hasta:</strong> ${fin}`,
          xPosition,
          yPosition
        );
        */
        tooltip.show(
          `<strong> ${d.srcElement.__data__.EtiquetaTooltip}<br></strong>`,
          xPosition,
          yPosition -40
        );
      })
      

      .click(function (d, i, datum, event) {
        /*
        console.log(event)
        const starting_time = new Date(d.srcElement.__data__.starting_time);
        const inicios = `${starting_time.getDate()}/${starting_time.getMonth() + 1}/${starting_time.getFullYear()} ${starting_time.getHours()}:${starting_time.getMinutes()}:${starting_time.getSeconds()}`;
        console.log(new Date(event.starting_time))
        console.log(starting_time)
        console.log(inicios)
        */
        const cx = d.srcElement.getAttribute("cx");
        const xPosition = cx ? parseFloat(cx) : null;
        const cy = d.srcElement.getAttribute("cy");
        const yPosition = cy ? parseFloat(cy) : null;

        const starting_time = new Date(d.srcElement.__data__.starting_time);
        const inicio = `${starting_time.getDate()}/${starting_time.getMonth() + 1
          }/${starting_time.getFullYear()} ${starting_time.getHours()}:${starting_time.getMinutes()}`;
        const ending_time = new Date(d.srcElement.__data__.ending_time);
        const fin = d.srcElement.__data__.ending_time
          ? `${ending_time.getDate()}/${ending_time.getMonth() + 1
          }/${ending_time.getFullYear()} ${ending_time.getHours()}:${ending_time.getMinutes()}`
          : "";

        tooltip.show(
          ` ${d.srcElement.__data__.EtiquetaTooltip}<br><strong></strong> ${inicio}<br><strong>Hasta:</strong> ${fin}`,
          xPosition,
          yPosition
        );
      });
    d3.select(this.target)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .datum(testData2)
      .call(chart);

    function formatoFechaHora(dateString) {
      // Detecta si el formato es 'dd/mm/yyyy hh:mm:ss' o 'yyyy-mm-dd hh:mm:ss'
      let datePart, timePart;

      if (dateString.includes("/")) {
        // Formato 'dd/mm/yyyy hh:mm:ss'
        [datePart, timePart] = dateString.split(" ");
        let [day, month, year] = datePart.split("/").map(Number);
        let [hours, minutes, seconds] = timePart.split(":").map(Number);
        return new Date(
          year,
          month - 1,
          day,
          hours,
          minutes,
          seconds
        ).getTime();
      } else if (dateString.includes("-")) {
        // Formato 'yyyy-mm-dd hh:mm:ss' (SQL)
        [datePart, timePart] = dateString.split(" ");
        let [year, month, day] = datePart.split("-").map(Number);
        let [hours, minutes, seconds] = timePart.split(":").map(Number);
        return new Date(
          year,
          month - 1,
          day,
          hours,
          minutes,
          seconds
        ).getTime();
      } else {
        throw new Error("Formato de fecha no reconocido");
      }
    }
  }
}

export function createTooltip(
  container: d3.Selection<HTMLElement, unknown, null, undefined>
) {
  // Create a tooltip element
  const tooltip = container
    .append("div")
    .attr("class", "d3-tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("box-shadow", "0px 4px 8px rgba(0, 0, 0, 0.2)");

  // Show tooltip
  const show = (content: string, x: number, y: number) => {
    tooltip
      .html(content)
      .style("visibility", "visible")
      .style("top", `${y + 10}px`) // Offset for better positioning
      .style("left", `${x + 10}px`);
  };

  // Move tooltip
  const move = (x: number, y: number) => {
    tooltip
      .style("top", `${y + 10}px`) // Offset for better positioning
      .style("left", `${x + 10}px`);
  };

  // Hide tooltip
  const hide = () => {
    tooltip.style("visibility", "hidden");
  };

  return { show, move, hide };
}
