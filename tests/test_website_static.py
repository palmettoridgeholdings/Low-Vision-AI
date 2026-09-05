"""Static validation for the access-ai.tech replacement package."""

from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET


SITE_ROOT = Path(__file__).parents[1] / "website" / "access-ai-tech"
HTML_FILES = sorted(SITE_ROOT.glob("*.html"))
VOID_ELEMENTS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}
REQUIRED_FOOTER_LINKS = {
    "privacy.html", "terms.html", "accessibility.html",
    "smart-glasses-poc.html", "mailto:founder@access-ai.tech",
}


class StructureParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.errors = []
        self.attrs = []
        self.ids = []
        self.h1_count = 0
        self.main_count = 0
        self.footer_depth = 0
        self.footer_links = set()

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        self.attrs.append((tag, attributes))
        if "id" in attributes:
            self.ids.append(attributes["id"])
        if tag == "h1":
            self.h1_count += 1
        if tag == "main":
            self.main_count += 1
        if tag == "footer":
            self.footer_depth += 1
        if self.footer_depth and tag == "a" and "href" in attributes:
            self.footer_links.add(attributes["href"])
        if tag not in VOID_ELEMENTS:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID_ELEMENTS:
            self.stack.pop()

    def handle_endtag(self, tag):
        if not self.stack:
            self.errors.append(f"unexpected closing </{tag}>")
            return
        opened = self.stack.pop()
        if opened != tag:
            self.errors.append(f"closed </{tag}> while <{opened}> was open")
        if tag == "footer":
            self.footer_depth -= 1


def parsed(path):
    parser = StructureParser()
    parser.feed(path.read_text(encoding="utf-8"))
    parser.close()
    return parser


def contrast_ratio(foreground, background):
    def luminance(color):
        channels = [int(color[index:index + 2], 16) / 255 for index in (1, 3, 5)]
        linear = [
            value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4
            for value in channels
        ]
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]

    first, second = sorted((luminance(foreground), luminance(background)), reverse=True)
    return (first + 0.05) / (second + 0.05)


def test_expected_public_package_exists():
    assert {path.name for path in HTML_FILES} == {
        "accessibility.html", "index.html", "privacy.html",
        "smart-glasses-poc.html", "terms.html",
    }
    for relative in (
        "assets/favicon.svg", "assets/site.css", "robots.txt", "sitemap.xml",
        "SMART_GLASSES_POC_SOURCE.md",
    ):
        assert (SITE_ROOT / relative).is_file()


def test_html_structure_and_metadata():
    for path in HTML_FILES:
        source = path.read_text(encoding="utf-8")
        parser = parsed(path)
        assert source.lower().startswith("<!doctype html>")
        assert not parser.errors, f"{path.name}: {parser.errors}"
        assert not parser.stack, f"{path.name}: unclosed {parser.stack}"
        assert parser.h1_count == 1
        assert parser.main_count == 1
        assert len(parser.ids) == len(set(parser.ids))

        html = next(attrs for tag, attrs in parser.attrs if tag == "html")
        assert html.get("lang") == "en"
        assert any(tag == "title" for tag, _attrs in parser.attrs)
        assert any(
            tag == "meta" and attrs.get("name") == "viewport"
            for tag, attrs in parser.attrs
        )
        assert any(
            tag == "meta" and attrs.get("name") == "description"
            and attrs.get("content", "").strip()
            for tag, attrs in parser.attrs
        )
        assert any(
            tag == "link" and attrs.get("rel") == "canonical"
            and attrs.get("href", "").startswith("https://access-ai.tech/")
            for tag, attrs in parser.attrs
        )
        for property_name in ("og:title", "og:description", "og:type", "og:url"):
            assert any(
                tag == "meta" and attrs.get("property") == property_name
                and attrs.get("content", "").strip()
                for tag, attrs in parser.attrs
            )
        assert any(
            tag == "a" and attrs.get("href") == "#main"
            for tag, attrs in parser.attrs
        )
        assert REQUIRED_FOOTER_LINKS <= parser.footer_links


def test_internal_links_and_fragments_resolve():
    for path in HTML_FILES:
        parser = parsed(path)
        for tag, attrs in parser.attrs:
            reference = attrs.get("href") if tag in {"a", "link"} else attrs.get("src")
            if not reference:
                continue
            parts = urlsplit(reference)
            if parts.scheme in {"http", "https", "mailto"} or reference.startswith("//"):
                continue
            target = path if not parts.path else (SITE_ROOT / parts.path)
            assert target.is_file(), f"{path.name}: missing {reference}"
            if parts.fragment:
                target_parser = parsed(target)
                assert parts.fragment in target_parser.ids, f"{path.name}: missing {reference}"


def test_contact_and_builder_language_are_clean():
    combined = "\n".join(path.read_text(encoding="utf-8") for path in HTML_FILES)
    combined += (SITE_ROOT / "SMART_GLASSES_POC_SOURCE.md").read_text(encoding="utf-8")
    emails = set(re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", combined))
    assert emails == {"founder@access-ai.tech"}
    assert not re.search(r"\b(emergent|mentra|lovable|builder\.io|bolt\.new|v0\.dev)\b", combined, re.I)


def test_existing_ga4_property_is_configured_once_per_page():
    for path in HTML_FILES:
        source = path.read_text(encoding="utf-8")
        scripts = [attrs for tag, attrs in parsed(path).attrs if tag == "script" and "src" in attrs]
        assert len(scripts) == 1, path.name
        assert scripts[0]["src"] == "https://www.googletagmanager.com/gtag/js?id=G-E4TE8BSQBV"
        assert "async" in scripts[0]
        configs = re.findall(r"gtag\(\s*['\"]config['\"]\s*,\s*['\"]([^'\"]+)['\"]", source)
        assert configs == ["G-E4TE8BSQBV"], path.name
        assert re.findall(r"\bG-[A-Z0-9]+\b", source) == ["G-E4TE8BSQBV"] * 2


def test_analytics_disclosure_and_compliance_claims():
    combined = "\n".join(path.read_text(encoding="utf-8") for path in HTML_FILES)
    assert not re.search(r"\b(WCAG|ADA)\s+(compliant|certified|conformant)\b", combined, re.I)
    privacy = (SITE_ROOT / "privacy.html").read_text(encoding="utf-8")
    policy = (SITE_ROOT.parents[1] / "docs" / "PRIVACY_POLICY.md").read_text(encoding="utf-8")
    for source in (privacy, policy):
        assert "uses Google Analytics for basic website measurement" in source
        assert "does not include Google Analytics" not in source
        for disclosure in ("page interactions", "approximate location derived from IP", "browser and device", "timestamps", "referrer", "usage data"):
            assert disclosure in source


def test_accessibility_baseline_is_present():
    css = (SITE_ROOT / "assets" / "site.css").read_text(encoding="utf-8")
    assert ":focus-visible" in css
    assert "min-height: 3rem" in css
    assert "prefers-reduced-motion" in css
    assert "forced-colors: active" in css
    for path in HTML_FILES:
        parser = parsed(path)
        assert any(tag == "nav" and attrs.get("aria-label") for tag, attrs in parser.attrs)


def test_core_palette_has_readable_contrast():
    assert contrast_ratio("#f7f9fc", "#07111f") >= 7
    assert contrast_ratio("#bac5d5", "#0d1a2b") >= 7
    assert contrast_ratio("#10151d", "#ffd166") >= 7
    assert contrast_ratio("#7bdff2", "#07111f") >= 7


def test_sitemap_and_robots_are_valid():
    tree = ET.parse(SITE_ROOT / "sitemap.xml")
    namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    locations = {node.text for node in tree.findall("sm:url/sm:loc", namespace)}
    assert locations == {
        "https://access-ai.tech/",
        "https://access-ai.tech/privacy.html",
        "https://access-ai.tech/terms.html",
        "https://access-ai.tech/accessibility.html",
        "https://access-ai.tech/smart-glasses-poc.html",
    }
    robots = (SITE_ROOT / "robots.txt").read_text(encoding="utf-8")
    assert "User-agent: *" in robots
    assert "Sitemap: https://access-ai.tech/sitemap.xml" in robots
    ET.parse(SITE_ROOT / "assets" / "favicon.svg")
