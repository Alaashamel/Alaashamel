import config from '../config/config.js';

const LANGUAGE_COLORS = {
  JavaScript: '#F1E05A',
  TypeScript: '#3178C6',
  Python: '#3572A5',
  Java: '#B07219',
  Go: '#00ADD8',
  Rust: '#DEA584',
  'C++': '#F34B7D',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Scala: '#C22D40',
  Lua: '#000080',
  Perl: '#0298C3',
  Haskell: '#5E5086',
  Shell: '#89E051',
  HTML: '#E34F26',
  CSS: '#563D7C',
  Vue: '#41B883',
  Svelte: '#FF3E00',
  R: '#198CE7',
  MATLAB: '#E16737',
  Markdown: '#083FA1',
  Dockerfile: '#384D54',
  Makefile: '#427819',
  Assembly: '#6E4C13',
  Elixir: '#6E4A7E',
  Clojure: '#DB5855',
  Erlang: '#B83998',
  Objective_C: '#438EFF',
  Groovy: '#4298B8',
  Julia: '#A270BA',
  TeX: '#3D6117',
  PowerShell: '#012456',
  Terraform: '#7B42BC',
  YAML: '#CB171E',
  JSON: '#292929',
};

const LIGHT_LANGUAGE_COLORS = {
  JavaScript: '#F1E05A',
  TypeScript: '#3178C6',
  Python: '#3572A5',
  Java: '#B07219',
  Go: '#00ADD8',
  Rust: '#DEA584',
  'C++': '#F34B7D',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
};

export class ThemeEngine {
  constructor(themeName) {
    const themeConfig = config.themes;
    const resolvedTheme = themeName || themeConfig.current || 'dark';
    this.name = resolvedTheme;
    this.colors = this._resolveTheme(resolvedTheme);
    this.languageColors = resolvedTheme === 'light' ? LIGHT_LANGUAGE_COLORS : LANGUAGE_COLORS;
  }

  _resolveTheme(name) {
    const themeConfig = config.themes;

    if (themeConfig.custom && themeConfig.custom[name]) {
      return { ...this._defaultColors(name), ...themeConfig.custom[name] };
    }

    const builtIn = themeConfig[name];
    if (builtIn) {
      return { ...this._defaultColors(name), ...builtIn };
    }

    return this._defaultColors('dark');
  }

  _defaultColors(themeName) {
    if (themeName === 'light') {
      return {
        background: '#FFFFFF',
        border: '#E1E4E8',
        title: '#24292F',
        text: '#57606A',
        icon: '#0969DA',
        primary: '#0969DA',
        secondary: '#1A7F37',
        progressBarBackground: '#E1E4E8',
        shadow: '#00000020',
        danger: '#CF222E',
        warning: '#9A6700',
        accent: '#8250DF',
        gradientStart: '#0969DA',
        gradientEnd: '#1A7F37',
      };
    }
    return {
      background: '#0D1117',
      border: '#30363D',
      title: '#F0F6FC',
      text: '#8B949E',
      icon: '#58A6FF',
      primary: '#58A6FF',
      secondary: '#3FB950',
      progressBarBackground: '#21262D',
      shadow: '#00000040',
      danger: '#F85149',
      warning: '#D29922',
      accent: '#BC8CFF',
      gradientStart: '#58A6FF',
      gradientEnd: '#3FB950',
    };
  }

  getLanguageColor(language) {
    if (!language) return this.colors.primary;
    if (config.languages.customColors && config.languages.customColors[language]) {
      return config.languages.customColors[language];
    }
    return this.languageColors[language] || this.colors.primary;
  }

  getGradient(id) {
    return `url(#grad-${id})`;
  }

  getShadowFilter(id) {
    return `url(#shadow-${id})`;
  }

  static getAvailableThemes() {
    const builtIn = Object.keys(config.themes).filter(
      (k) => k !== 'current' && k !== 'autoTheme' && k !== 'custom'
    );
    const custom = Object.keys(config.themes.custom || {});
    return [...builtIn, ...custom];
  }
}
