"use client";
// Origin: shadcn/ui (Embla Carousel), copied 2026-09-22. Restyled with fui- classes in 0.4 so it renders without Tailwind.

import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"

import { classes as cn } from "./shared";
import { Button } from "./controls"
import { carouselKeyMove, carouselNameProblem, carouselOffKey, carouselOwnsKey } from "./carousel-logic"
import { useDirection, type TextDirection } from "./direction"
import { useMediaQuery } from "./use-media-query"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselLabels = {
  /** The name of the key that goes back. */
  previous: string
  /** The name of the key that goes on. */
  next: string
  /** The name of a slide from its place and the count: "3 of 7". It is read with the word "slide" the role adds. */
  slide: (index: number, count: number) => string
}

const defaultLabels: CarouselLabels = {
  previous: "Previous slide",
  next: "Next slide",
  slide: (index, count) => `${index} of ${count}`,
}

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
  /** The words of the two keys and of each slide's name. English by default. */
  labels?: Partial<CarouselLabels>
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
  direction: TextDirection
  labels: CarouselLabels
} & Omit<CarouselProps, "labels">

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

declare const process: { env: { NODE_ENV?: string } }

/** Bundlers replace the expression; a page with no bundler has no `process`, and is not told. */
function inDevelopment() {
  try {
    return process.env.NODE_ENV !== "production"
  } catch {
    return false
  }
}

/**
 * A row (or a column) of slides, one in view. Give the region a name with `aria-label` or `aria-labelledby`.
 *
 * The region is a tab stop: with focus on it or on one of its two keys, the arrows of its axis move a slide (Left and
 * Right swap in a right-to-left page), Home and End go to the first and the last. Keys pressed inside a slide stay with
 * what is in the slide. Under reduced motion a slide arrives at once.
 */
function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  labels,
  className,
  children,
  onKeyDown,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  const direction = useDirection()
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const [carouselRef, api] = useEmblaCarousel(
    {
      direction,
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
      ...(reducedMotion ? { duration: 0 } : null),
    },
    plugins
  )
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)
  const words = React.useMemo(() => ({ ...defaultLabels, ...labels }), [labels])

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev()
  }, [api])

  const scrollNext = React.useCallback(() => {
    api?.scrollNext()
  }, [api])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (!api || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    if (event.defaultPrevented && !carouselOffKey(event.target)) return
    if (!carouselOwnsKey(event.target, event.currentTarget)) return
    const move = carouselKeyMove(event.key, orientation, direction)
    if (!move) return
    event.preventDefault()
    if (move === "previous") api.scrollPrev()
    else if (move === "next") api.scrollNext()
    else api.scrollTo(move === "first" ? 0 : api.scrollSnapList().length - 1)
  }

  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on("reInit", onSelect)
    api.on("select", onSelect)

    return () => {
      api?.off("reInit", onSelect)
      api?.off("select", onSelect)
    }
  }, [api, onSelect])

  const nameProblem = carouselNameProblem(props)
  React.useEffect(() => {
    if (nameProblem && inDevelopment()) console.warn(nameProblem)
  }, [nameProblem])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
        direction,
        labels: words,
      }}
    >
      <div
        onKeyDown={handleKeyDown}
        className={cn("fui-carousel", className)}
        data-orientation={orientation}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        tabIndex={0}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div
      ref={carouselRef}
      className="fui-carousel-viewport"
      data-slot="carousel-content"
    >
      <div
        className={cn("fui-carousel-track", className)}
        data-orientation={orientation}
        {...props}
      />
    </div>
  )
}

function CarouselItem({ className, ref, ...props }: React.ComponentProps<"div">) {
  const { orientation, api, labels } = useCarousel()
  const own = React.useRef<HTMLDivElement | null>(null)
  const subscribe = React.useCallback(
    (notify: () => void) => {
      if (!api) return () => {}
      api.on("reInit", notify).on("slidesChanged", notify)
      return () => {
        api.off("reInit", notify).off("slidesChanged", notify)
      }
    },
    [api]
  )
  // Its place among Embla's slides, as "3/7": known once the carousel has mounted, so the server names no slide.
  const place = React.useSyncExternalStore(
    subscribe,
    () => {
      const slides = api?.slideNodes() ?? []
      const at = own.current ? slides.indexOf(own.current) : -1
      return at < 0 ? "" : `${at + 1}/${slides.length}`
    },
    () => ""
  )
  const [index, count] = place.split("/").map(Number)
  const named = props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined

  return (
    <div
      ref={(node) => {
        own.current = node
        if (typeof ref === "function") return ref(node)
        if (ref) ref.current = node
      }}
      role="group"
      aria-roledescription="slide"
      aria-label={!named && index && count ? labels.slide(index, count) : undefined}
      data-slot="carousel-item"
      data-orientation={orientation}
      className={cn("fui-carousel-item", className)}
      {...props}
    />
  )
}

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon-sm",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev, labels } = useCarousel()

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      data-orientation={orientation}
      className={cn("fui-carousel-control", "fui-carousel-previous", className)}
      disabled={!canScrollPrev}
      focusableWhenDisabled
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeftIcon aria-hidden />
      <span className="fui-sr-only">{labels.previous}</span>
    </Button>
  )
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon-sm",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext, labels } = useCarousel()

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      data-orientation={orientation}
      className={cn("fui-carousel-control", "fui-carousel-next", className)}
      disabled={!canScrollNext}
      focusableWhenDisabled
      onClick={scrollNext}
      {...props}
    >
      <ChevronRightIcon aria-hidden />
      <span className="fui-sr-only">{labels.next}</span>
    </Button>
  )
}

export {
  type CarouselApi,
  type CarouselLabels,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  useCarousel,
}
