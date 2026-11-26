#!/usr/bin/env python3
"""RF30, RF35: converts the catalog spreadsheet (UNIFICADO) into src/lib/catalog/seed.json.

Usage: python3 -I scripts/build-catalog-seed.py <planilha.xlsx> [seed.json]
Interval = average of the spreadsheet range; yellow (warn) at the minimum when min != max (OPEN-17).
Categories are kept from the current seed.json (category plans are not in the spreadsheet).
"""
import json, re, sys, unicodedata
import openpyxl

src = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else "src/lib/catalog/seed.json"
old = json.load(open(out, encoding="utf-8"))
wb = openpyxl.load_workbook(src, data_only=True)


def rows(name):
    it = wb[name].iter_rows(values_only=True)
    head = next(it)
    for r in it:
        if r[0]:
            yield dict(zip(head, r))


def num(v):
    return (int(v) if float(v).is_integer() else float(v)) if isinstance(v, (int, float)) else None


def plan(name, lo, hi, action, unit):
    lo, hi = num(lo), num(hi)
    if lo is None and hi is None:
        return None
    lo = lo if lo is not None else hi
    hi = hi if hi is not None else lo
    avg = round((lo + hi) / 2)
    warn = round(lo) if lo != hi else None
    p = {"name": name, "intervalKm": None, "intervalHours": None, "action": action, "warnKm": None, "warnHours": None}
    if unit == "km":
        p["intervalKm"], p["warnKm"] = avg, warn
    else:
        p["intervalHours"], p["warnHours"] = avg, warn
    return p


def clean(*parts):
    return " · ".join(str(p) for p in parts if p not in (None, ""))


components = []


def add(r, category, model, details, plans):
    components.append({
        "code": r["ID"], "category": category, "brand": r["Marca"], "model": str(model),
        "modality": r.get("Modalidade"), "subcategory": r.get("Subcategoria") or r.get("Uso / subcategoria"),
        "details": details or None,
        "priceMin": num(r.get("Preço mín (R$)")) , "priceMax": num(r.get("Preço máx (R$)")),
        "plans": [p for p in plans if p],
    })


for r in rows("Transmissão"):
    add(r, "Transmissão", r["Linha / Grupo"], clean(r["Série / código"], r["Velocidades"], r["Acionamento"], f"nível {r['Nível']}" if r["Nível"] else None),
        [plan("Corrente", r["Corrente km (mín)"], r["Corrente km (máx)"], "REPLACE", "km"),
         plan("Cassete", r["Cassete km (mín)"], r["Cassete km (máx)"], "REPLACE", "km")])
for r in rows("Suspensão"):
    b, c = num(r["Revisão básica (h)"]), num(r["Revisão completa (h)"])
    add(r, "Suspensão", r["Modelo"], clean(r["Tipo"], f"bengala {r['Bengala (mm)']} mm" if r["Bengala (mm)"] else None, f"curso {r['Curso (mm)']} mm" if r["Curso (mm)"] else None, r["Versões / níveis"]),
        [plan("Revisão da câmara de ar" if "mortecedor" in str(r["Tipo"]) else "Revisão de lowers (óleo e retentores)", b, b, "SERVICE", "h"), plan("Revisão completa", c, c, "SERVICE", "h")])
for r in rows("Pneus"):
    add(r, "Pneus", r["Modelo"], clean(r["Posição ideal"], r["Medidas comuns"], r["Carcaça / composto"]),
        [plan("Troca", r["Vida útil km (mín)"], r["Vida útil km (máx)"], "REPLACE", "km")])
for sheet, cat, pname, action in [("Freios", "Freios", "Pastilhas", "REPLACE"), ("Rodas", "Rodas", "Revisão de rolamentos", "SERVICE"), ("Canotes", "Canotes", "Revisão", "SERVICE"), ("Selins", "Selins", None, None)]:
    for r in rows(sheet):
        unit = "h" if str(r.get("Unidade") or "").startswith("h") else "km"
        pl = [plan(pname, r["Durab. mín"], r["Durab. máx"], action, unit)] if pname else []
        add(r, cat, r["Modelo"], r["Detalhes"], pl)

pos = [("Grupo (TRX)", "Grupo"), ("Garfo (SUS)", "Garfo"), ("Amortecedor (SUS)", "Amortecedor"), ("Pneu diant. (PNE)", "Pneu dianteiro"),
       ("Pneu tras. (PNE)", "Pneu traseiro"), ("Freios (FRE)", "Freios"), ("Rodas (ROD)", "Rodas"), ("Canote (CAN)", "Canote"), ("Selim (SEL)", "Selim")]
codes = {c["code"] for c in components}
bikes = []
for r in rows("Bikes"):
    parts = [{"position": p, "code": r[col]} for col, p in pos if r[col]]
    missing = [p["code"] for p in parts if p["code"] not in codes]
    assert not missing, (r["ID"], missing)
    bikes.append({"code": r["ID"], "brand": r["Marca"], "model": r["Modelo"], "version": r["Versão / ano"], "category": r["Categoria"],
                  "frame": r["Quadro"], "listPrice": r["Preço de lista"], "parts": parts})



def norm(t):
    t = unicodedata.normalize("NFKD", str(t)).encode("ascii", "ignore").decode().lower()
    return " " + re.sub(r"[^a-z0-9]+", " ", t).strip() + " "


def best(text, cands):
    """Longest key found in the text; ties or no hit mean no link (the athlete picks the part)."""
    hits = sorted(((len(k), c) for k, c in cands if k.strip() and k in text), key=lambda x: -x[0])
    if not hits:
        return None
    top = {c["code"] for n, c in hits if n == hits[0][0]}
    return hits[0][1]["code"] if len(top) == 1 else None


def match_parts(r):
    """Conservative link of the free text of an old bike to catalog IDs (only unambiguous hits)."""
    out = []
    for pos, text, pref in [("Grupo", r["Transmissão"], "TRX"), ("Garfo", r["Garfo"], "SUS"), ("Amortecedor", r["Amortecedor"], "SUS"), ("Freios", r["Freios"], "FRE")]:
        if not text:
            continue
        t = norm(text)
        cs = []
        for c in components:
            if not c["code"].startswith(pref) or norm(c["brand"]).strip() not in t:
                continue
            det = c["details"] or ""
            if pref == "SUS" and not det.startswith("Garfo" if pos == "Garfo" else "Amortecedor"):
                continue
            if pref == "TRX":
                if "e-mtb" in c["model"].lower() or ("di2" in c["model"].lower()) != (" di2 " in t) or ("axs" in c["model"].lower() or "transmission" in c["model"].lower()) != (" axs " in t or " transmission " in t):
                    continue
                key = norm(re.sub(r"\(.*?\)", "", det.split(" · ")[0])) if c["brand"] == "Shimano" and re.match(r"^[A-Z]?\d{4}", det) else norm(re.sub(r"\b(mecânico|AXS|Di2)\b", "", c["model"]).replace(c["brand"], ""))
                if c["brand"] == "Shimano" and key.strip() == "": continue
                line = norm(re.sub(r"\b(mecânico|Di2|Linkglide)\b.*", "", c["model"]).replace(c["brand"], "")).strip()
                if c["brand"] == "Shimano" and " shimano " + line + " " not in t: continue
                cs.append((key, c))
            else:
                cs.append((norm(re.sub(r"\(.*?\)", "", c["model"])), c))
        code = best(t, cs)
        if code:
            out.append({"position": pos, "code": code})
    return out


for r in rows("Bikes antigas"):
    confirm = str(r["Confirmar peças?"]).startswith("Sim")
    bikes.append({"code": r["ID"], "brand": r["Marca"], "model": r["Modelo"], "version": r["Ano"], "category": r["Modalidade"], "frame": r["Quadro"],
                  "listPrice": r["Preço original"], "parts": [] if confirm else match_parts(r)})

d = {"source": "Planilha 'Catálogo de Peças de Ciclismo — UNIFICADO' (pesquisa de nov/2026)", "categories": old["categories"], "components": components, "bikeModels": bikes}
json.dump(d, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(components), "components", len(bikes), "bikes")
