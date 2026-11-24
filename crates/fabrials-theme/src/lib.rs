//! Shared Fabrials UI 0.12 monochrome carbon & crisp paper design tokens for native Rust/Rune apps.
//!
//! Zero external dependencies so every native app (`spanreed-ui`, `ditox`, `lightweave`, `resonant`)
//! can depend on a single source of truth regardless of which `rune` revision it pins.

/// An OKLCH color token with alpha (`0.0..=1.0`).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Oklch {
    pub l: f32,
    pub c: f32,
    pub h: f32,
    pub a: f32,
}

impl Oklch {
    pub const fn new(l: f32, c: f32, h: f32) -> Self {
        Self { l, c, h, a: 1.0 }
    }

    pub const fn with_alpha(l: f32, c: f32, h: f32, a: f32) -> Self {
        Self { l, c, h, a }
    }

    pub const fn alpha(self, a: f32) -> Self {
        Self { a, ..self }
    }
}

pub const fn oklch(l: f32, c: f32, h: f32) -> Oklch {
    Oklch::new(l, c, h)
}

pub const fn oklcha(l: f32, c: f32, h: f32, a: f32) -> Oklch {
    Oklch::with_alpha(l, c, h, a)
}

/// Architectural corner radii matching `@fabrials/ui` 0.12 (x.ai × opencode.ai).
pub mod radii {
    /// Structural sheets, hairline grids, and flush plates.
    pub const PLATE: f32 = 0.0;
    /// Square pixel status marks (`6×6px` with `1px` crisp edge).
    pub const MARK: f32 = 1.0;
    pub const MARK_SIZE: f32 = 6.0;
    /// Flat keycaps, progress bars, thumbnails, checkboxes.
    pub const KEY: f32 = 2.0;
    pub const THUMB: f32 = 2.0;
    pub const CHECK: f32 = 2.0;
    pub const BAR: f32 = 2.0;
    /// Mono tags, switches, and inline chips.
    pub const TAG: f32 = 3.0;
    /// Buttons, inputs, menus, dialogs, posters, and album covers.
    pub const CONTROL: f32 = 4.0;
    pub const MENU: f32 = 4.0;
    pub const DIALOG: f32 = 4.0;
    pub const POSTER: f32 = 4.0;
    pub const COVER: f32 = 4.0;
}

/// Shared house typography families.
pub mod families {
    pub const SANS: &str = "IBM Plex Sans";
    pub const MONO: &str = "IBM Plex Mono";
    pub const PAIR: (&str, &str) = (SANS, MONO);
}

/// Shared type scale constants `(size_px, weight, line_height_px)`.
pub mod type_scale {
    #[derive(Clone, Copy, Debug, PartialEq)]
    pub struct TypeSpec {
        pub size: f32,
        pub weight: f32,
        pub line_height: f32,
        pub mono: bool,
        pub tracking: f32,
        pub tabular: bool,
    }

    pub const BODY: TypeSpec = TypeSpec {
        size: 14.0,
        weight: 400.0,
        line_height: 20.0,
        mono: false,
        tracking: 0.0,
        tabular: false,
    };
    pub const STRONG: TypeSpec = TypeSpec {
        size: 14.0,
        weight: 500.0,
        line_height: 20.0,
        mono: false,
        tracking: 0.0,
        tabular: false,
    };
    pub const CONTROL: TypeSpec = TypeSpec {
        size: 13.0,
        weight: 500.0,
        line_height: 18.0,
        mono: false,
        tracking: 0.0,
        tabular: false,
    };
    pub const META: TypeSpec = TypeSpec {
        size: 12.0,
        weight: 400.0,
        line_height: 16.0,
        mono: false,
        tracking: 0.0,
        tabular: false,
    };
    pub const HEADING: TypeSpec = TypeSpec {
        size: 16.0,
        weight: 600.0,
        line_height: 22.0,
        mono: false,
        tracking: 0.0,
        tabular: false,
    };
    pub const STAT: TypeSpec = TypeSpec {
        size: 20.0,
        weight: 600.0,
        line_height: 26.0,
        mono: true,
        tracking: 0.0,
        tabular: true,
    };
    pub const LABEL: TypeSpec = TypeSpec {
        size: 11.0,
        weight: 500.0,
        line_height: 16.0,
        mono: true,
        tracking: 0.08,
        tabular: true,
    };
    pub const CODE: TypeSpec = TypeSpec {
        size: 13.0,
        weight: 400.0,
        line_height: 20.0,
        mono: true,
        tracking: 0.0,
        tabular: true,
    };
}

/// Complete semantic color palette for a Fabrials native surface.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ThemePalette {
    pub dark: bool,
    /// Primary canvas (`#0a0a0a` dark, `#fbfbfb` light).
    pub page: Oklch,
    /// Sidebar / rail ground (`#070707` dark, `#f5f5f5` light).
    pub sidebar: Oklch,
    /// Flush sheet / card surface (`#111111` dark, `#ffffff` light).
    pub surface: Oklch,
    /// Raised / hover / well surface (`#181818` dark, `#f2f2f2` light).
    pub raised: Oklch,
    /// Active / selected / segment surface (`#222222` dark, `#e6e6e6` light).
    pub active: Oklch,
    /// Sunken input / track surface (`#111111` dark, `#f2f2f2` light).
    pub sunken: Oklch,
    /// Quiet border for floating overlays and focused frames.
    pub border: Oklch,
    /// Whisper-quiet `1px` architectural hairline seam.
    pub separator: Oklch,
    /// Subtle alternating row stripe.
    pub stripe: Oklch,
    /// Pointer hover veil.
    pub hover: Oklch,
    /// Pointer press veil.
    pub press: Oklch,
    /// Primary foreground ink (`#f2f2f2` dark, `#181818` light).
    pub ink: Oklch,
    /// Secondary / muted foreground ink (`#8e8e8e` dark, `#6e6e6e` light).
    pub ink_muted: Oklch,
    /// Primary Stormlight accent fill.
    pub brand: Oklch,
    /// Primary Stormlight accent ink / focus ring.
    pub brand_ink: Oklch,
    /// High-contrast ink on a brand fill.
    pub on_brand: Oklch,
    /// Semantic status tones (used for `6×6px` square status marks & alerts).
    pub success: Oklch,
    pub warning: Oklch,
    pub danger: Oklch,
}

/// Pure zero-chroma monochrome carbon dark palette (`#0a0a0a` / `#070707` / `#111111`).
pub const CARBON: ThemePalette = ThemePalette {
    dark: true,
    page: oklch(0.1448, 0.0, 0.0),
    sidebar: oklch(0.100, 0.0, 0.0),
    surface: oklch(0.1776, 0.0, 0.0),
    raised: oklch(0.209, 0.0, 0.0),
    active: oklch(0.252, 0.0, 0.0),
    sunken: oklch(0.1776, 0.0, 0.0),
    border: oklch(0.245, 0.0, 0.0),
    separator: oklcha(1.0, 0.0, 0.0, 0.08),
    stripe: oklcha(1.0, 0.0, 0.0, 0.018),
    hover: oklcha(1.0, 0.0, 0.0, 0.055),
    press: oklcha(1.0, 0.0, 0.0, 0.10),
    ink: oklch(0.961, 0.0, 0.0),
    ink_muted: oklch(0.646, 0.0, 0.0),
    brand: oklch(0.776, 0.098, 258.0),
    brand_ink: oklch(0.820, 0.102, 256.0),
    on_brand: oklch(0.1448, 0.0, 0.0),
    success: oklch(0.80, 0.085, 168.0),
    warning: oklch(0.84, 0.095, 82.0),
    danger: oklch(0.76, 0.115, 24.0),
};

/// Pure zero-chroma crisp paper light palette (`#fbfbfb` / `#f5f5f5` / `#ffffff`).
pub const PAPER: ThemePalette = ThemePalette {
    dark: false,
    page: oklch(0.988, 0.0, 0.0),
    sidebar: oklch(0.972, 0.0, 0.0),
    surface: oklch(1.0, 0.0, 0.0),
    raised: oklch(0.961, 0.0, 0.0),
    active: oklch(0.925, 0.0, 0.0),
    sunken: oklch(0.961, 0.0, 0.0),
    border: oklch(0.890, 0.0, 0.0),
    separator: oklcha(0.0, 0.0, 0.0, 0.09),
    stripe: oklcha(0.0, 0.0, 0.0, 0.015),
    hover: oklcha(0.0, 0.0, 0.0, 0.045),
    press: oklcha(0.0, 0.0, 0.0, 0.09),
    ink: oklch(0.209, 0.0, 0.0),
    ink_muted: oklch(0.538, 0.0, 0.0),
    brand: oklch(0.517, 0.163, 260.0),
    brand_ink: oklch(0.481, 0.154, 260.0),
    on_brand: oklch(0.988, 0.0, 0.0),
    success: oklch(0.48, 0.085, 168.0),
    warning: oklch(0.50, 0.10, 70.0),
    danger: oklch(0.50, 0.15, 24.0),
};

pub const fn palette(dark: bool) -> ThemePalette {
    if dark { CARBON } else { PAPER }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn assert_zero_chroma_neutrals(p: ThemePalette) {
        let neutrals = [
            p.page,
            p.sidebar,
            p.surface,
            p.raised,
            p.active,
            p.sunken,
            p.border,
            p.separator,
            p.stripe,
            p.hover,
            p.press,
            p.ink,
            p.ink_muted,
            p.on_brand,
        ];
        for token in neutrals {
            assert_eq!(
                token.c, 0.0,
                "neutral token must have zero chroma: {token:?}"
            );
        }
    }

    #[test]
    fn carbon_and_paper_neutrals_are_pure_monochrome() {
        assert_zero_chroma_neutrals(CARBON);
        assert_zero_chroma_neutrals(PAPER);
        assert_eq!(palette(true), CARBON);
        assert_eq!(palette(false), PAPER);
        assert!(palette(true).dark);
        assert!(!palette(false).dark);
    }

    #[test]
    fn architectural_radii_stay_sharp() {
        const {
            assert!(radii::PLATE == 0.0);
            assert!(radii::MARK <= 1.0);
            assert!(radii::MARK_SIZE == 6.0);
            assert!(radii::KEY <= 2.0);
            assert!(radii::TAG <= 3.0);
            assert!(radii::CONTROL <= 4.0);
            assert!(radii::DIALOG <= 4.0);
        }
    }
}
