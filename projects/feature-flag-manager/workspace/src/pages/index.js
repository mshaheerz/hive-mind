import { NextPage } from 'next'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  const [count, setCount] = useState(0)

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Welcome to your new Next.js app!</h1>
      <p className={styles.description}>
        Get started by editing&nbsp;
        <code className={styles.code}>pages/index.js</code>
      </p>

      <button onClick={() => setCount(count + 1)}>Increment Count</button>
      <p>Current count: {count}</p>
    </div>
  )
}

export default Home
