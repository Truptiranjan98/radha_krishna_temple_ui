import { createContext, useCallback, useContext, useRef, useState } from 'react';
import FeatherIntro from '../components/FeatherIntro';

/**
 * Owns the peacock-feather curtain.
 *
 * Two ways it plays:
 *
 *  1. **Every page load.** The initial state is a queued intro, so a refresh,
 *     a direct link, a back-button restore — anything that boots the app —
 *     gets the feathers. There is deliberately no sessionStorage check: the
 *     temple asked for it every time you land, not once per visit.
 *
 *  2. **On demand,** via `useIntro()`. Anywhere in the tree can call
 *     `playIntro({ title, subtitle })` to mark a moment with the same
 *     animation — the puja booking uses it to cover the switch from the form
 *     to the confirmation, so the curtain lifts on the finished screen.
 *
 * Each play gets a fresh `key`, which remounts FeatherIntro and restarts the
 * CSS animations. Without that, a second call would render a component that
 * had already run its timers and would show nothing.
 */

const IntroContext = createContext(() => {});

export function useIntro() {
  return useContext(IntroContext);
}

export function IntroProvider({ children, playOnMount = true }) {
  const nextKey = useRef(1);
  const [intro, setIntro] = useState(() =>
    playOnMount ? { key: 0, title: undefined, subtitle: undefined } : null,
  );

  const playIntro = useCallback((options = {}) => {
    setIntro({ key: nextKey.current++, ...options });
  }, []);

  return (
    <IntroContext.Provider value={playIntro}>
      {children}
      {intro && (
        <FeatherIntro
          key={intro.key}
          title={intro.title}
          subtitle={intro.subtitle}
          hold={intro.hold}
          onDone={() => setIntro(null)}
        />
      )}
    </IntroContext.Provider>
  );
}
