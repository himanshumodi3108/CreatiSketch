import { Provider } from 'react-redux'
import { store } from '@/store'
import ErrorBoundary from '@/components/ErrorBoundary'
import '@/styles/globals.css'
import { Analytics } from '@vercel/analytics/next';

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <Component {...pageProps} />
        <Analytics />
      </Provider>
    </ErrorBoundary>
  )
}
