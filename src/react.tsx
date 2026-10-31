import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { type Config, createSounds, type NameOf, type Sounds } from "./sounds.ts";

const SoundsContext = createContext<Sounds<string> | null>(null);

type Props<Name extends string> = { readonly config: Config<Name>; readonly children: ReactNode };

/** Put this once at the root of your app. Every rule in `config` then applies to the whole page. */
export function SoundRoot<const Name extends string>({ config, children }: Props<Name>) {
  const [sounds] = useState(() => createSounds<string>(config));

  // Listeners are an external subscription, so an effect is the right tool for them.
  useEffect(() => sounds.start(), [sounds]);
  useEffect(() => sounds.configure(config), [sounds, config]);

  return <SoundsContext.Provider value={sounds}>{children}</SoundsContext.Provider>;
}

/** Plays sounds from code. Pass your config's type to check names: `useSounds<typeof config>()`. */
export function useSounds<C extends Config<string> = Config<string>>(): Sounds<NameOf<C>> {
  const sounds = useContext(SoundsContext);
  if (sounds === null) throw new Error("useSounds was called outside <SoundRoot>. Wrap your app in <SoundRoot config={...}> at the root.");
  return sounds;
}
