<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const emit = defineEmits(['bestand-geopend'])

const nieuwBestand = async () => {
    // Het dialoogvenster openen voor het bestand aan te maken
    const [ status, inhoud, padNaarBestand ] = await electronAPI.nieuwBestand()

    // De verversingsgraad van de gebruikers scherm opvragen
    const refreshRate = await electronAPI.refreshRate()

    // De gebruiker naar de editpagina laten navigeren met de bestandsgegevens als props
    router.push({
        name: 'edit',
        params: {
            inhoud: inhoud,
            padNaarBestand: padNaarBestand,
            refreshRate: refreshRate
        }
    })
}

const openBestand = async () => {
    // Het dialoogvenster openen voor het bestand te openen
    const [ status, inhoud, padNaarBestand ] = await electronAPI.openBestand()

    // De verversingsgraad van de gebruikers scherm opvragen
    const refreshRate = await electronAPI.refreshRate()

    // De gebruiker naar de editpagina laten navigeren met de bestandsgegevens als props
    router.push({
        name: 'edit',
        params: {
            inhoud: inhoud,
            padNaarBestand: padNaarBestand,
            refreshRate: refreshRate
        }
    })
}
</script>

<template>
    <div id="wrapper">
        <header>
            <h1 class="rounded shadow px-3 mt-3"><span id="OS_letter_1">O</span><span id="OS_letter_2">r</span><span id="OS_letter_3">b</span> <span id="OS_letter_4">S</span><span id="OS_letter_5">h</span><span id="OS_letter_6">o</span><span id="OS_letter_7">w</span></h1>
        </header>
        <div class="m-4" id="start_menu">
            <button @click="nieuwBestand" class="btn btn-primary shadow mx-2" id="nieuw_bestand" type="button">New project:</button>
            <button @click="openBestand" class="btn btn-secondary shadow mx-2" id="open_bestand" type="button">Existing project:</button>
        </div>
    </div>
</template>

<style lang="scss">
:root {
    --title_capital_font_size: 8vh;
    --title_small_font_size: 7vh;
}

#wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;

    height: 100vh;

    background: linear-gradient(
        to bottom right,
        #ffce46,
        #ffa9ff
    );

    header {
        display: flex;
        justify-content: center;

        h1 {
            width: fit-content;

            background: linear-gradient(
                to bottom right,
                #e24ca9,
                #fffc46
            );
        }
    }

    #start_menu {
        display: flex;
        flex-direction: row;

            button {
            display: flex;
            flex-direction: row;

            font-size: 3vh;
        }
    }

    /* De titel met "Orb Show" heeft een aparte kleur voor elke letter */
    #OS_letter_1 {
        font-size: var(--title_capital_font_size);
        color: yellow;
    }
    #OS_letter_2 {
        font-size: var(--title_small_font_size);
        color: red;
    }
    #OS_letter_3 {
        font-size: var(--title_small_font_size);
        color: blue;
    }
    #OS_letter_4 {
        font-size: var(--title_capital_font_size);
        color: purple;
    }
    #OS_letter_5 {
        font-size: var(--title_small_font_size);
        color: cyan;
    }
    #OS_letter_6 {
        font-size: var(--title_small_font_size);
        color: green;
    }
    #OS_letter_7 {
        font-size: var(--title_small_font_size);
        color: yellow;
    }
}
</style>
