<script lang="ts">
  import Icon from "$components/Icon.svelte";
  import DraggableChoice from "$components/DraggableChoice.svelte";
  import { backOut, expoOut } from "svelte/easing";
  import { crossfade, fade } from "svelte/transition";
  import { flip } from "svelte/animate";
  import { spring } from "svelte/motion";

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
  const pointerOffset = spring(0, {
    stiffness: 0.1,
    damping: 0.8,
    precision: 1,
  });

  let rankingDiv: HTMLElement;
  let rankingPointer: HTMLElement;
  let unselected = choices.filter((x) => !x.rank);
  let ranked: Array<ChoiceCard> = choices
    .filter((x) => x.rank)
    .sort((a, b) => a.rank! - b.rank!);
  let insertionPointerIndex: number | undefined;
  let isPointerShown = false;

  function select(choice: ChoiceCard) {
    unselected = [...unselected.filter((x) => x !== choice)];
    ranked = [...ranked, choice];
  }

  function unselect(choice: ChoiceCard) {
    unselected = [...unselected, choice];
    ranked = [...ranked.filter((x) => x !== choice)];
  }

  // TODO: This needs to detect if the user hasn't moved to the other side of
  // the nearest item
  function rankFromDrag(
    start: { x: number; y: number },
    final: { x: number; y: number }
  ): number {
    //- Get horizontal mid-line of all children of rankingDiv
    const midlines = [];
    for (const el of rankingDiv.children) {
      if (!el.attributes.getNamedItem("rankable")) continue;
      const { y, height } = el.getBoundingClientRect();
      const midline = y + height / 2;
      midlines.push(midline);
    }

    let rank;
    if (final.y <= midlines[0]) {
      // Pointer ended above all items; make first in the list
      rank = 1;
    } else if (final.y > midlines[midlines.length - 1]) {
      // Pointer ended below all items; make last in the list
      rank = ranked.length;
    } else {
      // Pointer ended somewhere between two elements in the list
      for (let i = 0; i < midlines.length - 1; i++) {
        if (start.y >= midlines[i] && start.y <= midlines[i + 1]) {
        }
        // Think of 'i' as represting space between two items in this list
        if (final.y >= midlines[i] && final.y <= midlines[i + 1]) {
          if (final.y < start.y) {
            // This item is being promoted. Add one because the space between
            // the first item and second item is rank 2 when promoting. When i=0,
            // ranking starts from the space above the first item.
            rank = i + 2;
          } else if (final.y > start.y) {
            // This item is being demoted. The space between the first item and
            // second item is rank 1 when demoting. When i=0, ranking starts from
            // the space between the first item and second item.
            rank = i + 1;
          } else {
            console.error(` Start Y: ${start.y}, Final Y: ${final.y}`);
            throw new Error(
              "Do not call `rankFromDrag` with equal Y values! Filter non-moves first!"
            );
          }
          break;
        }
      }
    }
    if (rank === undefined)
      throw new Error(
        `Expected: number. Got: ${rank}. Where was the mouse/pointer?`
      );
    return rank;
  }

  function handleDragStart(event: CustomEvent<DragStart>) {
    applyPointerMove(event.detail.y, true);
    isPointerShown = true;
  }

  function handleDragMove(event: CustomEvent<DragMove>) {
    if (event.detail.start.y === event.detail.current.y) return; // This didn't move
    const rank = rankFromDrag(event.detail.start, event.detail.current) - 1;
    if (insertionPointerIndex !== undefined && insertionPointerIndex !== rank) {
      // The point has moved to another rank, clean up the expansions but not the pointer
      clearExpansionClasses();
    }
    applyPartingInsertion(rank);
    applyPointerMove(event.detail.current.y);
  }

  function handleDragFinal(event: CustomEvent<DragFinal>, choice: ChoiceCard) {
    const startingRankIndex = ranked.findIndex((x) => x === choice);
    const startingRank = startingRankIndex + 1;
    if (event.detail.start.y === event.detail.end.y) return; // This didn't move
    const finalRank = rankFromDrag(event.detail.start, event.detail.end);
    const finalRankIndex = finalRank - 1;
    if (finalRank !== startingRank) {
      ranked = [
        ...ranked.slice(0, startingRankIndex),
        ...ranked.slice(startingRankIndex + 1),
      ];
      ranked = [
        ...ranked.slice(0, finalRankIndex),
        choice,
        ...ranked.slice(finalRankIndex),
      ];
    }
    cleanupUi();
  }

  function applyPartingInsertion(rankIndex: number) {
    // Make springy side-caret visible
    // Apply class to elements above and below this rankIndex
  }

  function applyPointerMove(y: number, hard?: boolean) {
    const offset =
      rankingDiv.getBoundingClientRect().y +
      rankingDiv.getBoundingClientRect().height / 2;
    pointerOffset.set(y - offset, { hard });
  }

  function cleanupUi() {
    clearExpansionClasses();
    clearInsertionPointer();
    insertionPointerIndex = undefined;
  }

  function clearExpansionClasses() {}

  function clearInsertionPointer() {
    isPointerShown = false;
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
          //- Any element with the 'rankable' attribute will be counted
          +if('isPointerShown')
            #ranking-pointer(
              "transition:fade"!="{ { duration: 300 } }"
              "style:transform"!="{`translateY(${$pointerOffset}px)`}"
              "bind:this"!="{rankingPointer}"
            )
              //- Thus it will ignore this pointer
              Icon("name"="chevron-right")
          +each("ranked as choice, index (choice.headerContent)")
            //- But rank each of these
            .w-full(
              rankable
              "in:receive"="{ { key: choice.headerContent, easing: backOut } }"
              "out:send"="{ { key: choice.headerContent, easing: expoOut } }"
              "animate:flip"="{ { duration: 300 } }"
            )
              DraggableChoice(
                "headerContent"!="{`${choice.headerContent}`}"
                "bodyContent"!="{ choice.bodyContent }"
                "on:close"!="{ () => unselect(choice) }"
                "on:dragStart"!="{handleDragStart}"
                "on:dragMove"!="{handleDragMove}"
                "on:dragFinal"!="{ (e) => handleDragFinal(e, choice) }"
                "on:dragCancel"!="{ () => cleanupUi() }"
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
