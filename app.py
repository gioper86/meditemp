from flask import Flask, render_template, Response, request
import flask
import json
import plotly

import pandas as pd
import numpy as np
import pyportal.connector as pypor
from tables import *
from json import encoder
import datetime as dt

encoder.c_make_encoder = None
encoder.FLOAT_REPR = lambda o: format(o, '.2f')

app = Flask(__name__)
app.debug = True

def prepare_arrays(fileh, index):
    m = fileh.root.sst[index]
    np.place(m, m<0, [np.nan])

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

def prepare_graph(m, glon, glat, index, times):

    timeinit = dt.datetime(1800,1,1)

    current = (timeinit+dt.timedelta(days=times[index])).strftime("%d %B %Y")
    first = (timeinit+dt.timedelta(days=times[0])).strftime("%d %B %Y")
    last = (timeinit+dt.timedelta(days=times[len(times)-1])).strftime("%d %B %Y")

    graph = dict(
            data=[
                dict(
                    z=m,
                    x=glon,
                    y=glat,
                    colorscale='Jet',
                    #zauto=False,  # custom contour levels
                    #zmin=10,      # first contour level
                    #zmax=32,        # last contour level  => colorscale is centered about 0
                    type='contour',
                    contours=dict(
                        start=10,
                        end=30,
                        size=1.5,
                        coloring='heatmap'
                    )
                )
            ],
            layout=dict(
                title="Mediterranean sea surface temperature " + current,
                hovermode="closest",        # highlight closest point on hover
                autosize=False,
                width=1000,
                height=500,
                plot_bgcolor='#F7F5E4'
            ),
            firstDay=first,
            lastDay=last,
            index=index
        )

    return graph

@app.route('/data')
def data():
    index = int(request.args.get('index')) if request.args.get('index') else 0 
    fileh = open_file("files/med_may2015_2016.nc", mode = "r")

    m, glon, glat = prepare_arrays(fileh, index)
    graph = prepare_graph(m, glon, glat, index, fileh.root.time)
    graphJSON = json.dumps(graph, cls=plotly.utils.PlotlyJSONEncoder)
    
    fileh.close()
    return Response(response=graphJSON, mimetype="application/json")
    

@app.route('/')
def index():
    return render_template('layouts/index.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9999)
