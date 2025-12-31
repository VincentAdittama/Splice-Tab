<script lang="ts">
  import { querySplice, SoundsSearchAutocomplete } from "$lib/splice/api";
  import Search from "lucide-svelte/icons/search";
  import { Card } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { cn } from "$lib/utils";
  import type {
    AutocompleteSuggestion,
    SoundsSearchAutocompleteResponse,
  } from "$lib/splice/types";

  let {
    value = $bindable(),
    onsubmit,
    class: className,
    inputRef = $bindable(null!),
  }: {
    value: string;
    onsubmit: () => void;
    class?: string;
    inputRef?: HTMLInputElement;
  } = $props();

  let lastSubmittedValue: string;
  let lastSuggestionValue = $state("");

  let open = $state(false);
  let selectIndex = $state(-1);

  let suggestions = $state<AutocompleteSuggestion[]>([]);

  let timer: NodeJS.Timeout;
  const debounce = (action: () => void, time: number = 200) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      action();
    }, time);
  };

  const submit = () => {
    lastSubmittedValue = value;
    onsubmit();
  };
</script>

<div class={cn("w-[180px] flex-grow flex-shrink-0", className)}>
  <button
    class={cn(
      "flex items-center border-input border px-3 rounded-md w-full cursor-text gap-2 ring-offset-background focus-within:ring-ring focus:ring-ring h-9 justify-between whitespace-nowrap bg-transparent py-2 text-sm shadow-sm focus-within:outline-none focus:outline-none focus-within:ring-1 focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    onmousedown={(e) => {
      e.preventDefault();
      inputRef.focus();
    }}
    tabindex={-1}
    onclick={() => inputRef.focus()}
  >
    <Search class="mr-2 size-4 shrink-0 opacity-50" />
    <input
      bind:value
      bind:this={inputRef}
      placeholder="Search samples..."
      onfocus={() => (open = true)}
      onblur={() => (open = false)}
      onkeydown={(event) => {
        if (event.key === "Enter") {
          open = false;
          if (value !== lastSubmittedValue) {
            submit();
          }
          return;
        } else if (event.key === "Escape") {
          open = false;
          return;
        }
        if (event.key === "ArrowDown") {
          selectIndex = Math.min(selectIndex + 1, suggestions.length - 1);
        } else if (event.key === "ArrowUp") {
          if (selectIndex == -1) {
            open = false;
          }
          selectIndex = Math.max(selectIndex - 1, -1);
        }
        if (event.key == "ArrowUp" || event.key == "ArrowDown") {
          if (selectIndex >= 0 && selectIndex < suggestions.length) {
            value = suggestions[selectIndex].autocompleteTerm;
            if (value !== lastSubmittedValue) {
              debounce(submit);
            }
            open = true;
          }
          if (suggestions.length > 0) {
            event.preventDefault();
          }
        }
      }}
      oninput={() => {
        selectIndex = -1;
        if (value !== lastSubmittedValue) {
          debounce(submit);
        }
        querySplice(SoundsSearchAutocomplete, { term: value }).then(
          (response) => {
            suggestions = (response as SoundsSearchAutocompleteResponse).data
              .soundsSearchSuggestions.results;
            lastSuggestionValue = value.trim().toLowerCase();
          }
        );
      }}
      class="select-text placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 outline-none disabled:cursor-not-allowed disabled:opacity-50 text-sm"
    />
  </button>
  <div class="relative w-full">
    <div class="absolute top-2 z-20">
      <!-- TODO: Use a popover instead -->
      <Card
        class={cn(
          "flex-col rounded-md p-1 min-w-48",
          open && suggestions.length > 0 ? "flex" : "hidden"
        )}
      >
        {#each suggestions as suggestion, index}
          <Button
            class={cn(
              "w-full text-left justify-normal font-normal text-sm duration-250 h-7",
              index == selectIndex
                ? "bg-accent text-accent-foreground"
                : "hover:bg-transparent hover:text-current"
            )}
            onmousemove={() => (selectIndex = index)}
            size="sm"
            tabindex={-1}
            variant="ghost"
            onmousedown={() => {
              value = suggestion.autocompleteTerm;
              open = false;
              submit();
            }}
          >
            <span>
              <span>{lastSuggestionValue}</span><span
                class="text-muted-foreground"
                >{(suggestion.autocompleteTerm as string).substring(
                  lastSuggestionValue.length
                )}</span
              >
            </span>
          </Button>
        {/each}
      </Card>
    </div>
  </div>
</div>
