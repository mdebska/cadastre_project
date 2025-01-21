import folium
import geopandas as gpd
from lxml import etree

map = folium.Map(location=[52.262323803464994, 20.555945054014632], zoom_start=15)


try:

    gml_file = 'c:/pythonProject/semestr5/kataster/proj3/Zbiór danych GML ZSK 2025.txt'
    layer_kontury = 'EGB_KonturKlasyfikacyjny'
    layer_grunt = 'EGB_KonturUzytkuGruntowego'

    with open(gml_file, 'r', encoding='utf-8') as file:
        xml_content = file.read()

    xml_content = xml_content.replace('<?xml version="1.0" encoding="UTF-8"?>', '')

    parser = etree.XMLParser(recover=True)
    root = etree.fromstring(xml_content.encode('utf-8'), parser=parser)

    fixed_gml_file = 'c:/pythonProject/semestr5/kataster/proj3/fixed_gml.gml'
    with open(fixed_gml_file, 'wb') as file:
        file.write(etree.tostring(root, pretty_print=True, encoding='utf-8'))

    # kontury użytku gruntowego
    gdf = gpd.read_file(fixed_gml_file, layer=layer_grunt)
    geometries = gdf.geometry
    geometries_gdf = gpd.GeoDataFrame(geometry=geometries)
    geometries_gdf.to_file('c:/pythonProject/semestr5/kataster/proj3/geom_grunty.gpkg', driver='GPKG')
    geometries_gdf = geometries_gdf.to_crs(epsg=4326)

    # Define a style function to set the color to red
    style_function_red = lambda x: {'color': 'red'}

    for index, row in geometries_gdf.iterrows():
        folium.GeoJson(row['geometry'], style_function=style_function_red).add_to(map)

    # kontury klasyfikacyjne
    gdf1 = gpd.read_file(fixed_gml_file, layer=layer_kontury)
    geometries1 = gdf1.geometry
    geometries_gdf1 = gpd.GeoDataFrame(geometry=geometries1)
    geometries_gdf1.to_file('c:/pythonProject/semestr5/kataster/proj3/geom_kontury.gpkg', driver='GPKG')
    geometries_gdf1 = geometries_gdf1.to_crs(epsg=4326)

    # Define a style function to make the contour lines thinner
    style_function_thin = lambda x: {'weight': '1'}

    for index, row in geometries_gdf1.iterrows():
        folium.GeoJson(row['geometry'], style_function=style_function_thin).add_to(map)

    # Add JavaScript to handle click events and check if the clicked location is inside any geometry

    map.save("Index.html")

except Exception as e:
    print(f"An error occurred: {e}")