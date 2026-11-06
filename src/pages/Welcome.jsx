import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { WELCOME_COVER } from '@/lib/constants';

export default function Welcome() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-ink-base text-white">
      <motion.div
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        <img src={WELCOME_COVER} alt="" className="h-full w-full object-cover" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-ink-base/80 via-ink-base/45 to-ink-base" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(229,9,20,0.18),transparent_60%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-7 pb-10 pt-14">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex items-center gap-3"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-flare" />
          <span className="t-kicker text-white/55">An original series</span>
        </motion.div>

        <div className="pb-8">
          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 1 }}
            className="t-wordmark t-over-image"
          >
            <span className="block text-[23vw] font-medium leading-[0.76] sm:text-[7.75rem]">PLOT</span>
            <span className="mt-1 block pl-[0.06em] text-[23vw] font-normal italic leading-[0.8] tracking-[-0.03em] text-flare sm:text-[7.25rem]">
              Twist
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-8 max-w-[19rem]"
          >
            <p className="t-lead text-white">Your life deserves its own series.</p>
            <p className="mt-3 text-[13px] leading-relaxed tracking-[0.01em] text-ink-soft">
              Every ordinary day has an extraordinary story. We turn the moments you save into episodes,
              seasons and season finales.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="space-y-3"
        >
          <Link
            to="/register"
            className="tap t-meta flex w-full items-center justify-center rounded-sm bg-flare py-4 font-semibold tracking-[0.22em] text-white hover:bg-flare-deep"
          >
            Start your story
          </Link>
          <Link
            to="/login"
            className="tap t-meta flex w-full items-center justify-center rounded-sm border border-white/25 py-4 font-semibold tracking-[0.22em] text-white/85 hover:bg-white/[0.06]"
          >
            I already have an account
          </Link>
          <p className="t-kicker pt-3 text-center text-white/30">Private by default · Season 01 waiting</p>
        </motion.div>
      </div>
    </div>
  );
}