<script setup>
// Het reactive element van het podium
const props = defineProps(['podium'])
</script>

<template>
    <div id="podium">

        <!-- plafond -->
        <div id="plafond"></div>

        <!-- Linker muur -->
        <div id="linker_muur"></div>

        <!-- Rechter muur -->
        <div id="rechter_muur"></div>

        <!-- lampen (plafond) -->
        <div id="plafond_lampen">
            <div v-for="kleur in props.podium.plafondLampKleuren">
                <div
                    class="plafond_lamp"
                    :style="{ backgroundColor: kleur }"
                ></div>
            </div>
        </div>

        <!-- Achterdoek -->
        <div id="achterdoek">
            <div
                v-for="kleur in props.podium.achterdoekKleuren"
                class="achterdoek_kleur"
                :style="{ backgroundColor: kleur }"
            ></div>
        </div>

        <!-- vloer -->
        <div id="vloer" style="background-color:black;"></div>

    </div>
</template>

<style lang="scss">
#podium {
    display: grid;
    grid-template-rows: 4% 7vh 1fr 60% 1fr 8%;
    grid-template-columns: repeat(3, 1fr) repeat(6, 7vh) repeat(3, 1fr);
    grid-template-areas:
    ". . ..... ..... ..... ..... ..... ..... ..... ..... . ."
    ". . ..... pl_la pl_la pl_la pl_la pl_la pl_la ..... . ."
    ". . ..... ..... ..... ..... ..... ..... ..... ..... . ."
    ". . ac_do ac_do ac_do ac_do ac_do ac_do ac_do ac_do . ."
    ". . ..... ..... ..... ..... ..... ..... ..... ..... . ."
    ". . ..... ..... ..... ..... ..... ..... ..... ..... . .";

    height: 50vh;
    width: 90vh;

    border: 1px solid black;
    background-color: aliceblue;

    #plafond, #vloer {
        background-color: black;
    }
    #linker_muur, #rechter_muur {
        background-color: grey;
    }
    #plafond, #vloer {
        grid-column: 1 / -1;
    }
    #linker_muur, #rechter_muur {
        grid-row: 2 / -2;
    }
    #plafond {
        grid-row-start: 1;
    }
    #linker_muur {
        grid-column-start: 1;
    }
    #rechter_muur {
        grid-column-end: -1;
    }
    #vloer {
        grid-row-end: -1;
    }

    #plafond_lampen {
        display: grid;
        grid-auto-flow: column;

        grid-area: pl_la;

        div {
            display: flex;
            justify-content: center;

            .plafond_lamp {
                width: 80%;
                height: 80%;

                border-radius: 100%;
                border: 2px dotted black;
            }
        }
    }

    #achterdoek {
        grid-area: ac_do;

        display: grid;
        grid-template-rows: repeat(6, 1fr);
        grid-template-columns: repeat(10, 1fr);

        background-color: yellow;
    }
}
</style>
