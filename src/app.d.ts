// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
	// interface Locals {}
	// interface Platform {}
	// interface PrivateEnv {}
	// interface PublicEnv {}
	// interface Session {}
	// interface Stuff {}
}

type ChoiceCard = {
  headerContent: string;
  bodyContent: string;
  rank?: number;
};

type DragFinal = {
  start: {
    x: number;
    y: number;
  };
  end: {
    x: number;
    y: number;
  };
};

type DragMove = {
  start: {
    x: number;
    y: number;
  };
  current: {
    x: number;
    y: number;
  };
};

declare module 'feather-icons';