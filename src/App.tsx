import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from './store/gameStore'
import { MobileFrame } from './components/layout/MobileFrame'
import { TitleScreen } from './screens/TitleScreen'
import { GameScreen } from './screens/GameScreen'
import { ResultScreen } from './screens/ResultScreen'
import { TutorialScreen } from './screens/TutorialScreen'
import { SkillTreeScreen } from './screens/SkillTreeScreen'

export default function App() {
  const { status } = useGameStore()
  const [showSkillTree, setShowSkillTree] = useState(false)

  return (
    <MobileFrame>
      <AnimatePresence mode="wait">
        {status === 'tutorial' && (
          <motion.div
            key="tutorial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <TutorialScreen />
          </motion.div>
        )}

        {status === 'title' && !showSkillTree && (
          <motion.div
            key="title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <TitleScreen onOpenSkillTree={() => setShowSkillTree(true)} />
          </motion.div>
        )}

        {status === 'title' && showSkillTree && (
          <motion.div
            key="skilltree"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <SkillTreeScreen onClose={() => setShowSkillTree(false)} />
          </motion.div>
        )}

        {status === 'playing' && (
          <motion.div
            key="game"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <GameScreen />
          </motion.div>
        )}

        {(status === 'won' || status === 'lost') && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <ResultScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </MobileFrame>
  )
}
