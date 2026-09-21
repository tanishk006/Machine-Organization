import HouseScene from './HouseScene';
import './App.css';

export default function App() {
	return (
		<main className="scene-app">
			<HouseScene />
			<div className="scene-overlay" aria-label="Scene information">
				<strong>Auto-Controlled Lights</strong>
				<span>WASD to move</span>
			</div>
		</main>
	);
}