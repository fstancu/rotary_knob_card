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
4. Select **Integration** as the category and click **Add**.
5. Now, search for **Rotary Knob Card** in the HACS store and click **Download**.
6. **Restart Home Assistant.**

## Dashboard Configuration

After installation and restart, you must register the frontend resource:

1. Go to **Settings** $\rightarrow$ **Dashboards**.
2. Click the **three dots (⋮)** $\rightarrow$ **Resources**.
3. Add a new resource:
   - **URL:** `/local/community/rotary_knob_card/rotary_knob_card.js`
   - **Type:** `JavaScript Module`

### Usage
Add a **Manual** card to your dashboard with the following YAML:

```yaml
type: custom:rotary-knob-card
entity: input_select.your_select_entity
name: "Room Mode"
