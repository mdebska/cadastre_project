from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import geopandas as gpd
from lxml import etree
import os

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

        layer_kontury = "EGB_KonturKlasyfikacyjny"
        layer_grunt = "EGB_KonturUzytkuGruntowego"

        # Grunt geometries
        gdf = gpd.read_file(fixed_gml_file, layer=layer_grunt)
        geometries_gdf = gdf.geometry
        geometries_gdf = gpd.GeoDataFrame(geometry=geometries_gdf).to_crs(epsg=4326)

        # Kontury geometries
        gdf1 = gpd.read_file(fixed_gml_file, layer=layer_kontury)
        geometries_gdf1 = gdf1.geometry
        geometries_gdf1 = gpd.GeoDataFrame(geometry=geometries_gdf1).to_crs(epsg=4326)

        geometries_gdf_json = geometries_gdf.to_json()
        geometries_gdf1_json = geometries_gdf1.to_json()
        
        return {
            "status": "success",
            "geometries_gdf": geometries_gdf_json,
            "geometries_gdf1": geometries_gdf1_json,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
