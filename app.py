from flask import Flask, render_template, Response, request
import flask
import json
import plotly

import pandas as pd
import numpy as np
import pyportal.connector as pypor
from tables import *


app = Flask(__name__)
app.debug = True

def prepare_arrays(fileh, index):
    m = fileh.root.sst[index]    
    #np.place(m, m<0, [np.nan])

    glon = []
    glat = []

    for item in fileh.root.lon:
        glon.append(item)
        
    for item in fileh.root.lat:
        glat.append(item)  

    tmp_lon = np.array([glon[n]-360 if l>=180 else glon[n] 
                       for n,l in enumerate(glon)])  # => [0,180]U[-180,2.5]

    i_east, = np.where(tmp_lon>=0)  # indices of east lon
    i_west, = np.where(tmp_lon<0)   # indices of west lon
    glon = np.hstack((tmp_lon[i_west], tmp_lon[i_east]))  # stack the 2 halves

    tmp_air = np.array(m)
    m = np.hstack((tmp_air[:,i_west], tmp_air[:,i_east]))

    return (m, glon, glat)

def prepare_graph(m, glon, glat, index):

    graph = dict(
            data=[
                dict(
                    z=m,
                    x=glon,
                    y=glat,
                    colorscale="Jet",
                    #zauto=False,  # custom contour levels
                    #zmin=-5,      # first contour level
                    #zmax=32        # last contour level  => colorscale is centered about 0
                    type='contour',
                    contours=dict(
                        start=10,
                        end=32,
                        size=1
                    )
                )
            ],
            layout=dict(
                title="Meditemp",
                hovermode="closest",        # highlight closest point on hover
                autosize=False,
                width=1000,
                height=500,
                plot_bgcolor='#FADD9B'
            ),
            index=index
        )

    return graph




@app.route('/data')
def data():
    index = int(request.args.get('index')) if request.args.get('index') else 0 
    fileh = open_file("files/med_may2015_2016.nc", mode = "r")

    m, glon, glat = prepare_arrays(fileh, index)
    graph = prepare_graph(m, glon, glat, index)
    graphJSON = json.dumps(graph, cls=plotly.utils.PlotlyJSONEncoder)
    
    fileh.close()
    return Response(response=graphJSON, mimetype="application/json")
    

@app.route('/')
def index():
    return render_template('layouts/index.html')


if __name__ == '__main__':
    app.run(port=9999)
