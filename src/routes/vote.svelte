<script lang="ts">
  import Icon from "$components/Icon.svelte";
  import DraggableChoice from "$components/DraggableChoice.svelte";
  import { backOut, expoOut } from "svelte/easing";
  import { crossfade, fade } from "svelte/transition";
  import { flip } from "svelte/animate";

  type input = {
    choices: ChoiceCard[];
  };

  export let choices: Array<ChoiceCard> = [
    { headerContent: "Alpha", bodyContent: "write some docs" },
    { headerContent: "Bravo", bodyContent: "start writing blog post" },
    { headerContent: "Charlie", bodyContent: "buy some milk", rank: 1 },
    { headerContent: "Delta", bodyContent: "mow the lawn" },
    { headerContent: "Zcho", bodyContent: "feed the turtle" },
    { headerContent: "Foxtrot", bodyContent: "fix some bugs" },
  ];

  const [send, receive] = crossfade({
    // Graph version of this is a parabolic/exponential curve upwards starting
    // at 150ms and clamping at 500ms max. It makes the appearance that the
    // animation is slowing down at larger distances without letting it slow too
    // much or have to start too slow.
    duration: (d) => Math.min(0.002 * d * d + 150, 500),

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

  let rankingDiv: HTMLElement;
  let rankingPointer: HTMLElement;
  let unselected = choices.filter((x) => !x.rank);
  let ranked: Array<ChoiceCard> = choices
    .filter((x) => x.rank)
    .sort((a, b) => a.rank! - b.rank!);
  let insertionPointerIndex: number | undefined;

  function select(choice: ChoiceCard) {
    unselected = [...unselected.filter((x) => x !== choice)];
    ranked = [...ranked, choice];
  }

  function unselect(choice: ChoiceCard) {
    unselected = [...unselected, choice];
    ranked = [...ranked.filter((x) => x !== choice)];
  }

  function rankFromDrag(
    start: {x: number, y: number},
    final: {x: number, y: number}
  ): number {
    //- Get horizontal mid-line of all children of rankingDiv
    const midlines = [];
    for (const el of rankingDiv.children) {
      const midline = el.getClientRects()[0].top + el.clientHeight / 2;
      midlines.push(midline);
    }
    let rank;
    if (final.y < midlines[0]) {
      // Pointer ended above all items; make first in the list
      rank = 1;
    } else if (final.y > midlines[midlines.length - 1]) {
      // Point ended below all items; make last in the list
      rank = ranked.length;
    } else {
      // Pointer ended somewhere between two elements in the list
      // const startMidline = midlines[choice.selected!.rank - 1];
      for (let i = 0; i < midlines.length - 1; i++) {
        // Rank is natural counting (i.e. starts at one), but remember we already handled rank 1 above. Thus, start at two.
        if (
          final.y >= midlines[i] &&
          final.y <= midlines[i + 1]
        ) {
          if (final.y < start.y) {
            // This item is being promoted. Offset by two:
            //  * +1 comes from the ranking being natural count (starts at 1 instead of 0)
            //  * +1 because between the first item and second is actual rank two (only when promoting)
            //
            // This makes it so that you have to drag this item above a rank's midline to set that rank (think: it 'push' the other items down)
            rank = i + 2;
          } else if (final.y >= start.y) {
            // This item is being demoted. Offset by two:
            //  * +1 comes from the ranking being natural count (starts at 1 instead of 0)
            //
            // This makes it so that you have to drag this item below a rank's midline to set that rank (think: it 'bump' the other items up)
            rank = i + 1;
          } else {
            throw new Error("Unreachable code");
          }
          break;
        }
      }
    }
    if (rank === undefined) throw new Error(`Expected: number. Got: ${rank}. Where was the mouse/pointer?`);
    return rank;
  }

  async function handleDragFinal(event: CustomEvent<DragFinal>, choice: ChoiceCard) {
    const startingRankIndex = rankFromDrag(event.detail.start, event.detail.end) - 1;
    const finalRankIndex = ranked.findIndex((x) => x === choice);
    ranked = [
      ...ranked.slice(0, startingRankIndex),
      ...ranked.slice(startingRankIndex + 1),
    ];
    ranked = [
      ...ranked.slice(0, finalRankIndex),
      choice,
      ...ranked.slice(finalRankIndex),
    ];
    cleanupPartingInsertion();
  }

  function handleDragMove(event: CustomEvent<DragMove>, choice: ChoiceCard) {
    const rank = rankFromDrag(event.detail.start, event.detail.current) - 1;
    if (insertionPointerIndex !== undefined && insertionPointerIndex !== rank) {
      // The point has moved to another rank, clean up the expansions but not the pointer
      clearExpansionClasses();
    }
    applyPartingInsertion(rank);
    applyPointerMove(event.detail.current.y);
  }

  function applyPartingInsertion(rankIndex: number) {
    // Make springy side-caret visible

    // Apply class to elements above and below this rankIndex
  }

  function applyPointerMove(y: number) {
    const offset = rankingDiv.getBoundingClientRect().y;
    rankingPointer.style.top = `${y - offset}px`;
  }

  function cleanupPartingInsertion() {
    clearExpansionClasses();
    clearInsertionPointer();
    insertionPointerIndex = undefined;
  }

  function clearExpansionClasses() {

  }

  function clearInsertionPointer() {

  }
</script>

<template lang="pug">
.container.mx-auto.py-4
  .flex.flex-row
    .card.bg-base-300.rounded-box.grow.h-fit(class="w-1/2")
      .card-body.mx-auto
        h3.card-title.mx-auto Choices
        .flex.flex-row.place-content-center.place-items-center.gap-4
          +each('unselected as choice (choice.headerContent)')
              .tooltip.tooltip-info.tooltip-right.shadow-sm.patch-tooltip(
                  data-tip="{ choice.bodyContent }"
                  "transition:fade"!="{ { duration: 100 } }"
                  "animate:flip"!="{ { duration: 300, delay: 50 } }"
                )
                .card.bg-base-100.shadow-lg.px-3.py-1(
                  "in:receive"!="{ { key: choice.headerContent, easing: expoOut } }"
                  "out:send"!="{ { key: choice.headerContent, easing: backOut } }"
                  "on:click"!="{ () => select(choice) }"
                ) { choice.headerContent }
    .divider.divider-horizontal
    .card.bg-base-300.rounded-box.grow.h-fit(class="w-1/2")
      .card-body.w-full
        h3.card-title.mx-auto Ranking
        #ranking-div.flex.flex-col.place-content-center.place-items-center.gap-3.ml-3("bind:this"!="{rankingDiv}")
          #ranking-pointer("bind:this"!="{rankingPointer}")
            Icon("name"="chevron-right")
          +each("ranked as choice, index (choice.headerContent)")
            .w-full(
              "in:receive"="{ { key: choice.headerContent, easing: backOut } }"
              "out:send"="{ { key: choice.headerContent, easing: expoOut } }"
              "animate:flip"="{ { duration: 300 } }"
            )
              DraggableChoice(
                "headerContent"!="{`${choice.headerContent}`}"
                "bodyContent"!="{ choice.bodyContent }"
                "on:close"!="{ () => unselect(choice) }"
                "on:dragMove"!="{ (e) => handleDragMove(e, choice) }"
                "on:dragFinal"!="{ (e) => handleDragFinal(e, choice) }"
              )
</template>

<style lang="scss">
  .patch-tooltip:before {
    z-index: 1;
  }
  .patch-tooltip:hover:before {
    transition-delay: 300ms;
  }
  .patch-tooltip:hover:after {
    transition-delay: 300ms;
  }
  #ranking-div {
    $pointer-offset: 0rem;
    $pointer-size: 2.5rem;
    position: relative;

    #ranking-pointer {
      position: absolute;
      right: calc(100%);
      margin-right: $pointer-offset;
      font-size: $pointer-size;
      transform: translateY(-50%);
    }
  }
</style>
