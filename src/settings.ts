"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
import ColorPicker = formattingSettings.ColorPicker;
import ToggleSwitch = formattingSettings.ToggleSwitch;
import NumUpDown = formattingSettings.NumUpDown;
import TextInput = formattingSettings.TextInput;

/**
 * General Formatting Card
 * This card contains general settings like color and labels.
 */
class GeneralCardSettings extends FormattingSettingsCard {
    // Color picker for default color
    defaultColor = new ColorPicker({
        name: "defaultColor",
        displayName: "Default Color",
        description: "Color used when no specific color is provided.",
        value: { value: "#0078D4" } // Default to blue
    });

    // Text input for label
    label = new TextInput({
        name: "label",
        displayName: "Label",
        description: "The default label for the visual.",
        placeholder: "Enter label text...",
        value: "Default Label"
    });

    // Toggle switch for enabling/disabling additional options
    showAllDataPoints = new ToggleSwitch({
        name: "showAllDataPoints",
        displayName: "Show All Data Points",
        description: "Toggle to show or hide all data points.",
        value: true
    });

    name: string = "general";
    displayName: string = "General Settings";
    slices: Array<FormattingSettingsSlice> = [
        this.defaultColor,
        this.label,
        this.showAllDataPoints
    ];
}

/**
 * Data Point Formatting Card
 * This card contains settings specific to data points, such as fill and text size.
 */
class DataPointCardSettings extends FormattingSettingsCard {
    // Fill color for data points
    fill = new ColorPicker({
        name: "fill",
        displayName: "Fill",
        description: "The fill color for data points.",
        value: { value: "#FF5733" } // Default to orange
    });

    // Rule-based color saturation
    fillRule = new ColorPicker({
        name: "fillRule",
        displayName: "Color Saturation",
        description: "Set rules for color saturation based on data values.",
        value: { value: "" }
    });

    // Font size for data point labels
    fontSize = new NumUpDown({
        name: "fontSize",
        displayName: "Font Size",
        description: "Font size for data point labels.",
        value: 12 // Default size
    });

    name: string = "dataPoint";
    displayName: string = "Data Point Settings";
    slices: Array<FormattingSettingsSlice> = [this.fill, this.fillRule, this.fontSize];
}

/**
 * Visual Formatting Settings Model
 * This model combines all formatting cards into a single structure.
 */
export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    // Define individual cards
    generalCard = new GeneralCardSettings();
    dataPointCard = new DataPointCardSettings();

    // Combine all cards
    cards = [this.generalCard, this.dataPointCard];
}
