'use client'

import { useEffect, useRef } from 'react'

// A lightweight Three.js data constellation. It is lazy-loaded, pauses when
// offscreen, and renders a static frame for reduced-motion users.
export function DataOrb() {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return

    let disposed = false
    let frame = 0
    let visible = true
    let cleanupThree: (() => void) | undefined

    const start = async () => {
      const THREE = await import('three')
      if (disposed) return

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setClearColor(0x000000, 0)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
      camera.position.set(0, 0, 7)

      const group = new THREE.Group()
      scene.add(group)

      const shell = new THREE.Mesh(
        new THREE.IcosahedronGeometry(2.25, 2),
        new THREE.MeshBasicMaterial({
          color: 0xf3ead8,
          wireframe: true,
          transparent: true,
          opacity: 0.34,
        })
      )
      group.add(shell)

      const inner = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.45, 1),
        new THREE.MeshBasicMaterial({
          color: 0x6ea8c9,
          wireframe: true,
          transparent: true,
          opacity: 0.24,
        })
      )
      group.add(inner)

      const nodeGeometry = new THREE.SphereGeometry(0.045, 8, 8)
      const gold = new THREE.MeshBasicMaterial({ color: 0xf2b35c })
      const mint = new THREE.MeshBasicMaterial({ color: 0x6ee7b7 })
      const nodePositions: Array<[number, number, number, number]> = [
        [2.25, 0.4, 1.1, 0],
        [-1.8, 1.5, 0.9, 1],
        [0.9, -2.1, 1.2, 0],
        [-2.1, -0.7, 1.4, 1],
        [1.4, 1.8, -1.0, 0],
      ]
      for (const [x, y, z, kind] of nodePositions) {
        const node = new THREE.Mesh(nodeGeometry, kind ? mint : gold)
        node.position.set(x, y, z)
        group.add(node)
      }

      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x9db8d2,
        transparent: true,
        opacity: 0.34,
      })
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.008, 8, 160), ringMaterial)
      ring1.rotation.x = Math.PI / 2.6
      ring1.rotation.z = 0.35
      group.add(ring1)
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.25, 0.006, 8, 160), ringMaterial)
      ring2.rotation.x = Math.PI / 1.7
      ring2.rotation.y = 0.5
      group.add(ring2)

      // Deterministic particle cloud so the scene looks the same on each visit.
      const count = 420
      const positions = new Float32Array(count * 3)
      let seed = 11
      const random = () => {
        seed = (seed * 16807) % 2147483647
        return (seed - 1) / 2147483646
      }
      for (let index = 0; index < count; index++) {
        const theta = random() * Math.PI * 2
        const phi = Math.acos(2 * random() - 1)
        const radius = 2.3 + random() * 0.9
        positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta)
        positions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
        positions[index * 3 + 2] = radius * Math.cos(phi)
      }
      const particles = new THREE.Points(
        new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3)),
        new THREE.PointsMaterial({
          color: 0xf7e7c9,
          size: 0.028,
          transparent: true,
          opacity: 0.7,
          sizeAttenuation: true,
        })
      )
      group.add(particles)

      const pointer = { x: 0, y: 0 }
      const target = { x: 0, y: 0 }
      const onPointer = (event: PointerEvent) => {
        const rect = host.getBoundingClientRect()
        pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
        pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
      }
      host.addEventListener('pointermove', onPointer)

      const resize = () => {
        const size = Math.max(260, Math.min(host.clientWidth, host.clientHeight))
        renderer.setSize(size, size, false)
        camera.aspect = 1
        camera.updateProjectionMatrix()
      }
      const observer = new ResizeObserver(resize)
      observer.observe(host)
      resize()

      const visibility = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting
        },
        { threshold: 0.05 }
      )
      visibility.observe(host)

      const clock = new THREE.Clock()
      const render = () => {
        if (disposed) return
        frame = requestAnimationFrame(render)
        if (!visible) return
        const elapsed = clock.getElapsedTime()
        target.x = pointer.y * 0.18
        target.y = pointer.x * 0.3
        group.rotation.x += (target.x - group.rotation.x) * 0.04
        group.rotation.y += (target.y - group.rotation.y) * 0.04
        group.rotation.z = Math.sin(elapsed * 0.12) * 0.02
        shell.rotation.y = elapsed * 0.055
        inner.rotation.y = -elapsed * 0.08
        ring1.rotation.z = 0.35 + elapsed * 0.03
        ring2.rotation.y = 0.5 - elapsed * 0.02
        particles.rotation.y = elapsed * 0.025
        renderer.render(scene, camera)
      }

      if (reduced) {
        renderer.render(scene, camera)
      } else {
        render()
      }

      cleanupThree = () => {
        cancelAnimationFrame(frame)
        host.removeEventListener('pointermove', onPointer)
        observer.disconnect()
        visibility.disconnect()
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
            object.geometry.dispose()
            const materials = Array.isArray(object.material) ? object.material : [object.material]
            for (const material of materials) material.dispose()
          }
        })
        renderer.dispose()
      }
    }

    start().catch(() => {
      // If WebGL is unavailable the surrounding copy still communicates the
      // dataset; no blank error state is needed.
    })

    return () => {
      disposed = true
      cleanupThree?.()
    }
  }, [])

  return (
    <div
      ref={hostRef}
      className="relative mx-auto aspect-square w-full max-w-[560px] touch-pan-y"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute left-2 top-6 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.16em] text-[#d8e5f4]">
          2026 · CAP R4
        </span>
        <span className="absolute right-2 top-16 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.16em] text-[#d8e5f4]">
          OPEN · GOPENS
        </span>
        <span className="absolute bottom-16 left-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.16em] text-[#d8e5f4]">
          DTE 16006
        </span>
        <span className="absolute bottom-5 right-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.16em] text-emerald-200">
          source-linked
        </span>
      </div>
    </div>
  )
}
