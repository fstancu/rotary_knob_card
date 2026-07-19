# Rotary Knob Card for Home Assistant

A beautiful, tactile rotary knob dashboard card that controls an `input_select` entity. 

## Features
- **Intuitive Control**: Click the knob to cycle through `input_select` options.
- **Smooth Animation**: Visual rotation matches the current state of the entity.
- **Neumorphic Design**: Modern dark-themed aesthetic that fits perfectly in Home Assistant.

## Installation via HACS

1. Open **HACS** in your Home Assistant instance.
2. Click the **three dots (⋮)** in the top right corner and select **Custom repositories**.
3. Paste the following URL: `https://github.com/fstancu/rotary_knob_card`
4. Select **Dashboard** as the category and click **Add**.
5. Now, search for **Rotary Knob Card** in the HACS store and click **Download**.
6. **Restart Home Assistant.**

### Usage
Add a **Manual** card to your dashboard with the following YAML:

```yaml
type: custom:rotary-knob-card
entity: input_select.<your_select_entity>
name: "<My Rotary Knob>"
