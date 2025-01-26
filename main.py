from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import geopandas as gpd
from lxml import etree
import os

# WARSTWY W GML'U
# 'OT_ZagospodarowanieTerenu' (default), 'PrezentacjaGraficzna', 'OT_Rzedna', 'OT_Ogrodzenia', 'OT_Komunikacja', 
# 'OT_Budowle', 'GES_UrzadzeniaSiecTelekomunikacyjna', 'GES_PrzewodTelekomunikacyjny', 'GES_InneUrzadzeniaTowarzyszace', 
# 'GES_PrzewodElektroenergetyczny', 'GES_PrzewodWodociagowy', 'GES_Rzedna', 'GES_UrzadzeniaSiecElektroenergetyczna', 
# 'GES_PrzewodKanalizacyjny', 'GES_UrzadzeniaSiecKanalizacyjna', 'GES_UrzadzeniaSiecWodociagowa', '', 
# 'EGB_ObrebEwidencyjny', 'EGB_JednostkaEwidencyjna', 'EGB_Budynek', 'EGB_ObiektTrwaleZwiazanyZBudynkiem', 'EGB_BlokBudynku', 
# 'EGB_KonturUzytkuGruntowego', 'EGB_KonturKlasyfikacyjny', 'EGB_Malzenstwo', 'EGB_OsobaFizyczna', 'EGB_Instytucja', 
# 'EGB_JednostkaRejestrowaGruntow', 'EGB_UdzialWeWlasnosci', 'EGB_UdzialWeWladaniu', 'EGB_AdresZameldowania', 'EGB_AdresNieruchomosci', 
# 'EGB_PunktGraniczny', 'EGB_Zmiana', 'EGB_Dokument', 'EGB_OperatTechniczny'

# EGB_KonturKlasyfikacyjny i EGB_DzialkaEwidencyjna, 'EGB_Budynek',  - warstwy z geometriami, wyświetlające się na mapie
# Co powinno być w tabeli: EGB_DzialkaEwidencyjna, EGB_ObrebEwidencyjny, EGB_JednostkaEwidencyjna,
# 'EGB_BlokBudynku', EGB_OsobaFizyczna', EGB_AdresNieruchomosci, EGB_PunktGraniczny, EGB_OperatTechniczny



app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return FileResponse(os.path.join("static", "index.html"))

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_methods=["*"],
    allow_headers=["*"],
)

class FileContent(BaseModel):
    content: str

@app.post("/upload")
async def upload_file(file_content: FileContent):
    try:
        xml_content = file_content.content
        xml_content = xml_content.replace('<?xml version="1.0" encoding="UTF-8"?>', '')
        parser = etree.XMLParser(recover=True)
        root = etree.fromstring(xml_content.encode('utf-8'), parser=parser)

        if not os.path.exists('created_data'):
            os.makedirs('created_data')

        fixed_gml_file = r"created_data\fixed_gml.gml"
        with open(fixed_gml_file, "wb") as f:
            f.write(etree.tostring(root, pretty_print=True, encoding="utf-8"))

        layer_dzialka = "EGB_DzialkaEwidencyjna"
        layer_kontury = "EGB_KonturKlasyfikacyjny"
        layer_budynki = "EGB_Budynek"
        layer_obreb = "EGB_ObrebEwidencyjny"
        layer_jednostka = "EGB_JednostkaEwidencyjna"
        layer_OTZZB = "EGB_ObiektTrwaleZwiazanyZBudynkiem"
        layer_konturUG = "EGB_KonturUzytkuGruntowego"
        layer_pg = "EGB_PunktGraniczny"

        # Osoba fizyczna
        # gdf_osoba = gpd.read_file(fixed_gml_file, layer=layer_osoba)
        # print(gdf_osoba.columns)
        # osoba = gdf_osoba[['idOsoby', 'imie', 'nazwisko']]

        # Dzialka geometries
        gdf = gpd.read_file(fixed_gml_file, layer=layer_dzialka)
        geometries_gdf = gdf[['idDzialki', 'numerKW', 'poleEwidencyjne' , 'geometry']]
        geometries_gdf = geometries_gdf.to_crs(epsg=4326)
        geometries_gdf = gpd.GeoDataFrame(geometries_gdf, geometry='geometry')
        # print columns
        # print(geometries_gdf.columns)        

        # Kontury geometries
        gdf1 = gpd.read_file(fixed_gml_file, layer=layer_kontury)
        geometries_gdf1 = gdf1[['idKonturu', 'OZU', 'OZK', 'geometry']]
        geometries_gdf1 = geometries_gdf1.to_crs(epsg=4326)
        geometries_gdf1 = gpd.GeoDataFrame(geometries_gdf1, geometry='geometry')
        # print(geometries_gdf1)

        # Budynki geometries
        gdf2 = gpd.read_file(fixed_gml_file, layer=layer_budynki)
        geometries_gdf2 = gdf2[['idBudynku', 'liczbaKondygnacjiNadziemnych', 'liczbaKondygnacjiPodziemnych',
                                'powZabudowy' ,'geometry']]
        geometries_gdf2 = geometries_gdf2.to_crs(epsg=4326)
        geometries_gdf2 = gpd.GeoDataFrame(geometries_gdf2, geometry='geometry')

        # Obreb geometries
        gdf3 = gpd.read_file(fixed_gml_file, layer=layer_obreb)
        geometries_gdf3 = gdf3[['idObrebu', 'geometry']]
        geometries_gdf3 = geometries_gdf3.to_crs(epsg=4326)
        geometries_gdf3 = gpd.GeoDataFrame(geometries_gdf3, geometry='geometry')

        # Jednostka geometries
        gdf4 = gpd.read_file(fixed_gml_file, layer=layer_jednostka)
        geometries_gdf4 = gdf4[['idJednostkiEwid', 'geometry']]
        geometries_gdf4 = geometries_gdf4.to_crs(epsg=4326)
        geometries_gdf4 = gpd.GeoDataFrame(geometries_gdf4, geometry='geometry')

        # ObiektTrwaleZwiazanyZBudynkiem
        gdf5 = gpd.read_file(fixed_gml_file, layer = layer_OTZZB)
        geometries_gdf5 = gdf5[['geometry']]
        geometries_gdf5 = geometries_gdf5.to_crs(epsg=4326)
        geometries_gdf5 = gpd.GeoDataFrame(geometries_gdf5, geometry='geometry')

        # Kontur użytku gruntowego
        gdf6 = gpd.read_file(fixed_gml_file, layer=layer_konturUG)
        geometries_gdf6 = gdf6[['idUzytku', 'geometry']]
        geometries_gdf6 = geometries_gdf6.to_crs(epsg=4326)
        geometries_gdf6 = gpd.GeoDataFrame(geometries_gdf6, geometry='geometry')

        # Punkt graniczny
        gdf7 = gpd.read_file(fixed_gml_file, layer=layer_pg)
        geometries_gdf7 = gdf7[['idPunktu','geometry']]
        geometries_gdf7 = geometries_gdf7.to_crs(epsg=4326)
        geometries_gdf7 = gpd.GeoDataFrame(geometries_gdf7, geometry='geometry')

        geometries_gdf_json = geometries_gdf.to_json()
        geometries_gdf1_json = geometries_gdf1.to_json()
        geometries_gdf2_json = geometries_gdf2.to_json()
        geometries_gdf3_json = geometries_gdf3.to_json()
        geometries_gdf4_json = geometries_gdf4.to_json()
        geometries_gdf5_json = geometries_gdf5.to_json()
        geometries_gdf6_json = geometries_gdf6.to_json()
        geometries_gdf7_json = geometries_gdf7.to_json()
        
        return {
            "status": "success",
            "geometries_gdf": geometries_gdf_json,
            "geometries_gdf1": geometries_gdf1_json,
            "geometries_gdf2": geometries_gdf2_json,
            "geometries_gdf3": geometries_gdf3_json,
            "geometries_gdf4": geometries_gdf4_json,
            "geometries_gdf5": geometries_gdf5_json,
            "geometries_gdf6": geometries_gdf6_json,
            "geometries_gdf7": geometries_gdf7_json,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
