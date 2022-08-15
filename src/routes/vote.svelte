<script lang="ts">
  import Icon from "../components/Icon.svelte";
  import { backOut, expoOut } from "svelte/easing";
  import { crossfade, fade } from "svelte/transition";
  import { flip } from "svelte/animate";
  import { tick } from "svelte";

  let rankingDiv: HTMLElement;

  const [send, receive] = crossfade({
    duration: (d) => 350 - 0.00001 * (d * d),

    fallback(node, _params) {
      const style = getComputedStyle(node);
      const transform = style.transform === "none" ? "" : style.transform;

      return {
        duration: 600,
        easing: expoOut,
        css: (t) => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`,
      };
    },
  });

  let uid = 1;

  type Choice = {
    id: number;
    selected?: {
      rank: number;
    };
    name: string;
    description: string;
  };

  let choices: Array<Choice> = [
    { id: uid++, name: "Alpha", description: "write some docs" },
    { id: uid++, name: "Bravo", description: "start writing blog post" },
    {
      id: uid++,
      selected: { rank: 1 },
      name: "Charlie",
      description: "buy some milk",
    },
    { id: uid++, name: "Delta", description: "mow the lawn" },
    { id: uid++, name: "Zcho", description: "feed the turtle" },
    { id: uid++, name: "Foxtrot", description: "fix some bugs" },
  ];

  $: rankedChoices = choices
    .filter((x) => x.selected)
    .sort((a, b) => a.selected!.rank - b.selected!.rank);

  function getIndex() {
    const rankings = choices
      .filter((x) => x.selected)
      .map((x) => x.selected!.rank);
    if (rankings.length) return Math.max(...rankings);
    else return 0;
  }

  let rankIndex = getIndex();

  function add(input: HTMLInputElement) {
    const newChoice: Choice = {
      id: uid++,
      selected: undefined,
      name: input.value,
      description: "Write-In",
    };

    choices = [newChoice, ...choices];
    input.value = "";
  }

  function refreshSort() {
    choices = choices.sort((a, b) => {
      if (a.selected && b.selected) {
        return a.selected.rank - b.selected.rank;
      } else if (a.selected && !b.selected) {
        // A is ranked, thus 'larger'
        return 1;
      } else if (!a.selected && b.selected) {
        // A is not ranked, thus 'smaller'
        return -1;
      } else {
        // Both A and B are unranked
        return 0;
      }
    });
  }

  function select(choice: Choice) {
    rankIndex++;
    choice.selected = {
      rank: rankIndex,
    };
    refreshSort();
  }

  function unselect(choice: Choice) {
    rankIndex -= 1;
    choice.selected = undefined;
    for (const x of choices.filter((x) => x.selected)) {
      if (x.selected!.rank > rankIndex) x.selected!.rank--;
    }
    refreshSort();
  }

  function startDrag(outerEvent: Event, choice: Choice) {
    document.addEventListener(
      "mouseup",
      (e) => resolveDrag(e, choice, outerEvent.target as HTMLElement),
      {
        once: true,
        passive: true,
      }
    );
  }
  function resolveDrag(event: MouseEvent, choice: Choice, srcEl: HTMLElement) {
    // get horizontal mid-line of all children of rankingDiv
    const midlines = [];
    for (const el of rankingDiv.children) {
      const midline = el.getClientRects()[0].top + el.clientHeight / 2;
      midlines.push(midline);
    }
    let rank;
    if (event.clientY < midlines[0]) {
      // This is to be the first in the list
      rank = 1;
    } else if (event.clientY > midlines[midlines.length - 1]) {
      // This is to be the last in the list
      rank = rankIndex;
    } else {
      // The is somewhere between two elements in the list
      const startMidline = midlines[choice.selected!.rank - 1];
      for (let i = 0; i < midlines.length - 1; i++) {
        // Rank is natural counting (i.e. starts at one), but remember we already handled rank 1 above. Thus, start at two.
        if (event.clientY > midlines[i] && event.clientY < midlines[i + 1]) {
          if (event.clientY < startMidline) {
            // This item is being promoted. Offset by two:
            //  * +1 comes from the ranking being natural count (starts at 1 instead of 0)
            //  * +1 because between the first item and second is actual rank two (only when promoting)
            //
            // This makes it so that you have to drag this item above a rank's midline to set that rank (think: it 'push' the other items down)
            rank = i + 2;
          } else if (event.clientY > startMidline) {
            // This item is being demoted. Offset by two:
            //  * +1 comes from the ranking being natural count (starts at 1 instead of 0)
            //
            // This makes it so that you have to drag this item below a rank's midline to set taht rank (think: it 'bump' the other items up)
            rank = i + 1;
          }
          break;
        }
      }
    }
    if (!rank) throw new Error("Unexpected: Undefined rank when dragging");
    reindexChoices(choice, rank);
  }

  function reindexChoices(choice: Choice, rank: number) {
    const startRank = choice.selected!.rank;
    if (startRank < rank) {
      // This item is getting demoted, thus promote other items
      const inBetween = choices
        .filter(
          (x) =>
            x.selected &&
            x !== choice &&
            x.selected.rank > startRank &&
            x.selected.rank <= rank
        )
        .forEach((x) => x.selected!.rank--);
    } else if (startRank > rank) {
      // This item is getting promoted, thus demote other items
      const inBetween = choices
        .filter(
          (x) =>
            x.selected &&
            x !== choice &&
            x.selected.rank < startRank &&
            x.selected.rank >= rank
        )
        .forEach((x) => x.selected!.rank++);
    }
    choice.selected!.rank = rank;
    refreshSort();
  }
</script>

<template lang="pug">
.container.mx-auto.py-4
  .flex.flex-row
    .card.bg-base-300.rounded-box.grow.h-fit(class="w-1/2")
      .card-body.mx-auto
        h3.card-title.mx-auto Choices
        .flex.flex-row.place-content-center.place-items-center.gap-4
          +each('choices.filter(x => !x.selected) as choice (choice.id)')
              .tooltip.tooltip-info.tooltip-right.shadow-sm.patch-tooltip(
                  data-tip="{ choice.description }"
                  "out:fade"="{ { duration: 50 } }"
                  "animate:flip"!="{ { duration: 250, delay: 100 } }"
                )
                .card.bg-base-100.shadow-lg.px-3.py-1(
                  "in:receive"!="{ { key: choice.id, easing: expoOut } }"
                  "out:send"!="{ { key: choice.id, easing: backOut } }"
                  "on:click"!="{ () => select(choice, true) }"
                ) { choice.name }
    .divider.divider-horizontal
    .card.bg-base-300.rounded-box.grow.h-fit(class="w-1/2")
      .card-body.w-full
        h3.card-title.mx-auto Ranking
        .flex.flex-col.place-content-center.place-items-center.gap-3("bind:this"!="{rankingDiv}")
          //- This should ONLY have children that are the draggable list elements
          +each("rankedChoices as choice (choice.id)")
            animation.w-full(
              "in:receive"="{ { key: choice.id, easing: backOut } }"
              "out:send"="{ { key: choice.id, expoOut } }"
              "animate:flip"="{ { duration: 300 } }"
              "on:mousedown|preventDefault"!="{ (e) => startDrag(e, choice) }"
            )
              .card.card-compact.bg-base-100.shadow-xl.w-full
                .card-body.flex-row.items-center
                  .place-self-center.text-stone-700.ml-1.text-lg
                    Icon(name="menu")
                  .divider.divider-horizontal.ml-1(class="before:bg-stone-300 after:bg-stone-300")
                  .grow("on:mousedown|stopPropagation")
                    h5.card-title { choice.name } [{ choice.selected.rank }]
                    p { choice.description }
                  .btn.btn-circle.shadow-sm.btn-sm.bg-stone-100.border-stone-300.text-stone-600.justify-self-end.duration-75(
                    class="hover:scale-110 hover:bg-stone-400 hover:border-stone-400 hover:text-stone-50 hover:shadow"
                    "on:mousedown|stopPropagation"
                    "on:click"!="{ () => unselect(choice) }"
                  )
                    Icon(name="x")
</template>

<style>
  .patch-tooltip:before {
    z-index: 1;
  }
  .patch-tooltip:hover:before {
    transition-delay: 300ms;
  }
  .patch-tooltip:hover:after {
    transition-delay: 300ms;
  }
</style>
